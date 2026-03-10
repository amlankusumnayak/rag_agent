"""
agentic_system/graph/rag_graph.py
LangGraph StateGraph — orchestrates the RAG agent workflow.

Flow:
  user_input
      │
      ▼
  route_query  ──► vector / sql / both / direct
      │
      ▼
  retrieve_context
      │
      ▼
  generate_answer
      │
      ▼
  END
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from typing import TypedDict, List, Optional, Annotated
import operator

from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage

from core.config import settings
from core.logging import get_logger
from agentic_system.config.prompts import SYSTEM_PROMPT, ANSWER_SYNTHESIS_PROMPT
from agentic_system.config.settings import agent_settings
from agentic_system.retrievers.vector_retriever import vector_retriever
from agentic_system.retrievers.sql_retriever import sql_retriever
from agentic_system.memory.conversation_memory import memory_store

logger = get_logger(__name__)


# ── State ─────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    session_id: str
    question: str
    route: str                              # "vector" | "sql" | "both" | "direct"
    vector_context: str
    sql_context: str
    combined_context: str
    history: str
    answer: str
    sources: List[str]
    iteration: int


# ── LLM ──────────────────────────────────────────────────────────────────────

def _get_llm() -> ChatOllama:
    return ChatOllama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=agent_settings.temperature,
        num_predict=agent_settings.max_tokens,
    )


# ── Nodes ─────────────────────────────────────────────────────────────────────

def route_query_node(state: AgentState) -> AgentState:
    """Decide retrieval strategy based on question content."""
    q = state["question"].lower()

    sql_keywords = {
        "count", "how many", "total", "sum", "average", "max", "min",
        "list all", "show all", "table", "database", "records", "rows",
        "select", "where", "group by", "order by",
    }
    doc_keywords = {
        "document", "file", "report", "policy", "article", "pdf", "text",
        "explain", "describe", "what does", "according to", "mention",
    }

    has_sql = any(kw in q for kw in sql_keywords)
    has_doc = any(kw in q for kw in doc_keywords)

    if has_sql and has_doc:
        route = "both"
    elif has_sql:
        route = "sql"
    elif has_doc:
        route = "vector"
    else:
        # Default to vector for general questions
        route = "vector"

    logger.info(f"Routing '{state['question'][:50]}' -> {route}")
    return {**state, "route": route}


def retrieve_vector_node(state: AgentState) -> AgentState:
    """Retrieve from ChromaDB vector store."""
    docs = vector_retriever.search(state["question"])
    sources = []
    parts = []
    for doc in docs:
        src = doc.metadata.get("filename", "unknown")
        sources.append(src)
        parts.append(f"[{src}]\n{doc.page_content}")
    context = "\n\n---\n\n".join(parts) if parts else "No relevant documents found."
    return {**state, "vector_context": context, "sources": sources}


def retrieve_sql_node(state: AgentState) -> AgentState:
    """Retrieve from MySQL via generated SQL."""
    result = sql_retriever.query(state["question"])
    context = sql_retriever.results_to_text(result)
    return {**state, "sql_context": context}


def combine_context_node(state: AgentState) -> AgentState:
    """Merge vector and SQL contexts."""
    parts = []
    if state.get("vector_context") and "No relevant" not in state["vector_context"]:
        parts.append(f"=== Document Context ===\n{state['vector_context']}")
    if state.get("sql_context") and "No results" not in state["sql_context"]:
        parts.append(f"=== Database Context ===\n{state['sql_context']}")
    combined = "\n\n".join(parts) if parts else "No context retrieved."
    return {**state, "combined_context": combined}


def generate_answer_node(state: AgentState) -> AgentState:
    """Generate the final answer using Ollama llama3."""
    llm = _get_llm()
    history = memory_store.get_history_text(state["session_id"])

    prompt = ANSWER_SYNTHESIS_PROMPT.format(
        question=state["question"],
        context=state.get("combined_context") or state.get("vector_context") or state.get("sql_context") or "No context.",
        history=history,
    )

    try:
        response = llm.invoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ])
        answer = response.content.strip()
    except Exception as e:
        logger.error(f"LLM generation error: {e}")
        answer = f"I encountered an error generating a response: {e}"

    # Persist to memory
    memory_store.add_turn(state["session_id"], "user", state["question"])
    memory_store.add_turn(state["session_id"], "assistant", answer)

    return {**state, "answer": answer}


# ── Routing edges ─────────────────────────────────────────────────────────────

def route_to_retrieval(state: AgentState) -> str:
    route = state.get("route", "vector")
    if route == "sql":
        return "sql"
    elif route == "both":
        return "both_vector"
    else:
        return "vector"


# ── Build Graph ───────────────────────────────────────────────────────────────

def build_rag_graph() -> StateGraph:
    g = StateGraph(AgentState)

    g.add_node("route_query", route_query_node)
    g.add_node("retrieve_vector", retrieve_vector_node)
    g.add_node("retrieve_sql", retrieve_sql_node)
    g.add_node("combine_context", combine_context_node)
    g.add_node("generate_answer", generate_answer_node)

    g.set_entry_point("route_query")

    g.add_conditional_edges(
        "route_query",
        route_to_retrieval,
        {
            "vector": "retrieve_vector",
            "sql": "retrieve_sql",
            "both_vector": "retrieve_vector",
        },
    )

    # After vector: either go to combine (if both) or directly generate
    def after_vector(state: AgentState) -> str:
        return "retrieve_sql" if state["route"] == "both" else "generate_answer"

    g.add_conditional_edges("retrieve_vector", after_vector, {
        "retrieve_sql": "retrieve_sql",
        "generate_answer": "generate_answer",
    })

    # After SQL: combine if both, else generate
    def after_sql(state: AgentState) -> str:
        return "combine_context" if state["route"] == "both" else "generate_answer"

    g.add_conditional_edges("retrieve_sql", after_sql, {
        "combine_context": "combine_context",
        "generate_answer": "generate_answer",
    })

    g.add_edge("combine_context", "generate_answer")
    g.add_edge("generate_answer", END)

    return g.compile()


# Compiled graph singleton
rag_graph = build_rag_graph()
