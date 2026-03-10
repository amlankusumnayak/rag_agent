"""
backend/services/ingest_service.py
Orchestrates file discovery -> parsing -> chunking -> vector store ingestion.
Uses Python 3.14 parallel processing for maximum throughput.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
from typing import List, Dict, Any, Optional

from core.config import settings
from core.logging import get_logger
from utils.file_parser import parse_files_parallel, discover_files
from utils.chunker import chunk_documents
from agentic_system.retrievers.vector_retriever import vector_retriever

logger = get_logger(__name__)


class IngestService:

    async def ingest_directory(
        self, directory: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Discover, parse, chunk, and embed all files in a directory.
        """
        base_dir = directory or settings.ingest_base_dir
        logger.info(f"Starting ingestion from: {base_dir}")

        # 1. Discover files
        file_paths = discover_files(base_dir)
        if not file_paths:
            return {"status": "no_files", "files_found": 0, "chunks_added": 0}

        logger.info(f"Found {len(file_paths)} files")

        # 2. Parse in parallel (multi-process, Python 3.14)
        parsed = await parse_files_parallel(file_paths)
        logger.info(f"Parsed {len(parsed)} files")

        # 3. Chunk
        chunks = chunk_documents(parsed)
        logger.info(f"Generated {len(chunks)} chunks")

        # 4. Embed and store
        added = vector_retriever.add_chunks(chunks)

        return {
            "status": "success",
            "base_dir": base_dir,
            "files_found": len(file_paths),
            "files_parsed": len(parsed),
            "chunks_added": added,
        }

    async def ingest_files(self, file_paths: List[str]) -> Dict[str, Any]:
        """Ingest a specific list of file paths."""
        parsed = await parse_files_parallel(file_paths)
        chunks = chunk_documents(parsed)
        added = vector_retriever.add_chunks(chunks)
        return {
            "status": "success",
            "files_parsed": len(parsed),
            "chunks_added": added,
        }

    def get_vector_store_info(self) -> Dict[str, Any]:
        return vector_retriever.get_collection_info()


ingest_service = IngestService()
