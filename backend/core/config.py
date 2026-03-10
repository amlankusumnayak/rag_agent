"""
core/config.py — Centralised settings loaded from .env
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import json


class Settings(BaseSettings):
    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # MySQL
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "rag_db"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection: str = "rag_docs"

    # File ingestion
    ingest_base_dir: str = "./data"

    # App
    # app_host: str = "0.0.0.0"
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    debug: bool = True
    cors_origins: List[str] = Field(default=["http://localhost:5173"])

    @property
    def mysql_url(self) -> str:
        return (
            f"mysql+mysqlconnector://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
