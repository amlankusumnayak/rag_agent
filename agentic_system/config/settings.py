"""
agentic_system/config/settings.py — Agent-specific settings
"""
from dataclasses import dataclass


@dataclass
class AgentSettings:
    # Retrieval
    top_k_documents: int = 5
    top_k_sql_rows: int = 20
    similarity_threshold: float = 0.3

    # LLM
    temperature: float = 0.1
    max_tokens: int = 2048

    # Memory
    max_history_turns: int = 10

    # Graph
    max_iterations: int = 5


agent_settings = AgentSettings()
