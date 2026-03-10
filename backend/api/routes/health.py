"""
backend/api/routes/health.py — Health check endpoint
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from fastapi import APIRouter
from core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health():
    return {
        "status": "ok",
        "ollama_url": settings.ollama_base_url,
        "ollama_model": settings.ollama_model,
        "mysql_host": settings.mysql_host,
        "mysql_database": settings.mysql_database,
    }
