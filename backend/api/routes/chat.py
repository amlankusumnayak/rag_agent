"""
backend/api/routes/chat.py — Chat endpoint
"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from agentic_system.agents.rag_agent import rag_agent
from core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    question: str
    answer: str
    sources: List[str]
    route: str


class HistoryResponse(BaseModel):
    session_id: str
    history: List[dict]


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message and get a RAG-powered response."""
    session_id = req.session_id or str(uuid.uuid4())
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        result = await rag_agent.chat(req.question, session_id)
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(session_id: str):
    """Get conversation history for a session."""
    history = rag_agent.get_history(session_id)
    return HistoryResponse(session_id=session_id, history=history)


@router.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear conversation history for a session."""
    rag_agent.clear_history(session_id)
    return {"message": f"History cleared for session {session_id}"}
