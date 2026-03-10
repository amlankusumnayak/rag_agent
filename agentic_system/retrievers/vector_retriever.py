"""
agentic_system/retrievers/vector_retriever.py
ChromaDB vector store retriever using Ollama embeddings.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from typing import List, Dict, Any
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain.schema import Document

from core.config import settings
from core.logging import get_logger
from agentic_system.config.settings import agent_settings

logger = get_logger(__name__)


class VectorRetriever:
    def __init__(self):
        self._embeddings = OllamaEmbeddings(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
        )
        self._store = Chroma(
            collection_name=settings.chroma_collection,
            persist_directory=settings.chroma_persist_dir,
            embedding_function=self._embeddings,
        )

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Ingest text chunks into ChromaDB.
        Returns number of chunks added.
        """
        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        self._store.add_texts(texts=texts, metadatas=metadatas)
        logger.info(f"Added {len(chunks)} chunks to vector store")
        return len(chunks)

    def search(self, query: str, k: int = None) -> List[Document]:
        k = k or agent_settings.top_k_documents
        try:
            results = self._store.similarity_search(query, k=k)
            logger.info(f"Vector search returned {len(results)} docs for: {query[:60]}")
            return results
        except Exception as e:
            logger.error(f"Vector search error: {e}")
            return []

    def search_with_score(self, query: str, k: int = None) -> List[tuple]:
        k = k or agent_settings.top_k_documents
        try:
            return self._store.similarity_search_with_relevance_scores(
                query, k=k, score_threshold=agent_settings.similarity_threshold
            )
        except Exception as e:
            logger.error(f"Vector search with score error: {e}")
            return []

    def get_collection_info(self) -> Dict[str, Any]:
        try:
            col = self._store._collection
            return {"count": col.count(), "name": settings.chroma_collection}
        except Exception:
            return {"count": 0, "name": settings.chroma_collection}


# Singleton
vector_retriever = VectorRetriever()
