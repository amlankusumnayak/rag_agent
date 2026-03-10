"""
agentic_system/tools/rag_tools.py
LangChain Tool wrappers for the retrievers.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from typing import Optional
from langchain.tools import Tool
from agentic_system.retrievers.vector_retriever import vector_retriever
from agentic_system.retrievers.sql_retriever import sql_retriever


# ── Vector Search Tool ────────────────────────────────────────────────────────

def _vector_search_fn(query: str) -> str:
    """Search indexed documents for relevant context."""
    docs = vector_retriever.search(query)
    if not docs:
        return "No relevant documents found."
    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("filename", "unknown")
        parts.append(f"[Doc {i} | Source: {source}]\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


vector_search_tool = Tool(
    name="document_search",
    func=_vector_search_fn,
    description=(
        "Search through indexed files (PDF, DOCX, TXT, CSV, XLSX, MD) "
        "using semantic similarity. Use this for questions about document content, "
        "policies, reports, articles, or any unstructured text."
    ),
)


# ── SQL Query Tool ────────────────────────────────────────────────────────────

def _sql_query_fn(question: str) -> str:
    """Query the MySQL database using natural language."""
    result = sql_retriever.query(question)
    return sql_retriever.results_to_text(result)


sql_query_tool = Tool(
    name="database_query",
    func=_sql_query_fn,
    description=(
        "Query the MySQL database using natural language. Use this for questions "
        "about structured data, counts, aggregations, specific records, or any "
        "data stored in relational tables."
    ),
)


# ── Schema Info Tool ──────────────────────────────────────────────────────────

def _schema_info_fn(_: str) -> str:
    """Return the MySQL database schema."""
    return sql_retriever.get_schema()


schema_info_tool = Tool(
    name="database_schema",
    func=_schema_info_fn,
    description=(
        "Get the MySQL database schema — table names, column names, and data types. "
        "Use this to understand what data is available before querying."
    ),
)


ALL_TOOLS = [vector_search_tool, sql_query_tool, schema_info_tool]
