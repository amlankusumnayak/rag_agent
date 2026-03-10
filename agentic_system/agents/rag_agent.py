"""
agentic_system/agents/rag_agent.py
High-level agent API called by the FastAPI backend.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

import uuid
import asyncio
from typing import Dict, Any, AsyncIterator

from core.logging import get_logger
from agentic_system.graph.rag_graph import rag_graph, AgentState
from agentic_system.memory.conversation_memory import memory_store

logger = get_logger(__name__)


class RAGAgent:
    """Wraps the LangGraph RAG pipeline with async support."""

    async def chat(
        self,
        question: str,
        session_id: str,
    ) -> Dict[str, Any]:
        """
        Run the full RAG graph for a single question.
        Returns dict with answer, sources, route, and session_id.
        """
        initial_state: AgentState = {
            "session_id": session_id,
            "question": question,
            "route": "",
            "vector_context": "",
            "sql_context": "",
            "combined_context": "",
            "history": "",
            "answer": "",
            "sources": [],
            "iteration": 0,
        }

        loop = asyncio.get_event_loop()
        # LangGraph invoke is synchronous; run in thread to not block event loop
        result = await loop.run_in_executor(
            None, lambda: rag_graph.invoke(initial_state)
        )

        return {
            "session_id": session_id,
            "question": question,
            "answer": result.get("answer", "No answer generated."),
            "sources": list(set(result.get("sources", []))),
            "route": result.get("route", "unknown"),
        }

    def get_history(self, session_id: str):
        return memory_store.get_history(session_id)

    def clear_history(self, session_id: str):
        memory_store.clear(session_id)


# Singleton
rag_agent = RAGAgent()
