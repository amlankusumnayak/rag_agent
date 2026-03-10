"""
agentic_system/memory/conversation_memory.py
In-memory per-session conversation history with a sliding window.
"""
from collections import defaultdict
from typing import List, Dict, Any
from agentic_system.config.settings import agent_settings


class ConversationMemory:
    """Thread-safe conversation memory keyed by session_id."""

    def __init__(self):
        self._store: Dict[str, List[Dict[str, str]]] = defaultdict(list)

    def add_turn(self, session_id: str, role: str, content: str) -> None:
        self._store[session_id].append({"role": role, "content": content})
        # Keep sliding window
        max_turns = agent_settings.max_history_turns * 2  # user + assistant
        if len(self._store[session_id]) > max_turns:
            self._store[session_id] = self._store[session_id][-max_turns:]

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        return list(self._store[session_id])

    def get_history_text(self, session_id: str) -> str:
        turns = self._store[session_id]
        if not turns:
            return "No previous conversation."
        lines = []
        for t in turns:
            prefix = "User" if t["role"] == "user" else "Assistant"
            lines.append(f"{prefix}: {t['content']}")
        return "\n".join(lines)

    def clear(self, session_id: str) -> None:
        self._store.pop(session_id, None)

    def list_sessions(self) -> List[str]:
        return list(self._store.keys())


# Singleton
memory_store = ConversationMemory()
