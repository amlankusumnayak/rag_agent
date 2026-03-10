"""
backend/main.py — FastAPI application entrypoint
"""
import sys
import os

# Make backend and project root importable
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from core.logging import get_logger
from api.routes.chat import router as chat_router
from api.routes.ingest import router as ingest_router
from api.routes.health import router as health_router

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 RAG Agent API starting up...")
    logger.info(f"   Ollama: {settings.ollama_base_url} | Model: {settings.ollama_model}")
    logger.info(f"   MySQL:  {settings.mysql_host}/{settings.mysql_database}")
    logger.info(f"   Chroma: {settings.chroma_persist_dir}")
    yield
    logger.info("RAG Agent API shutting down.")


app = FastAPI(
    title="RAG Agent API",
    description="LangGraph + LangChain + Ollama RAG system with FastAPI",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(ingest_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "RAG Agent API", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.debug,
        workers=1,  # LangGraph state is in-process; use 1 worker + async
    )
