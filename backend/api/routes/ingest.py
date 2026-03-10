"""
backend/api/routes/ingest.py — File ingestion endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import tempfile, os, shutil

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from backend.services.ingest_service import ingest_service
from core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/ingest", tags=["ingest"])


class DirectoryIngestRequest(BaseModel):
    directory: Optional[str] = None


class IngestResponse(BaseModel):
    status: str
    files_found: Optional[int] = None
    files_parsed: Optional[int] = None
    chunks_added: int


@router.post("/directory", response_model=IngestResponse)
async def ingest_directory(req: DirectoryIngestRequest, background_tasks: BackgroundTasks):
    """
    Trigger ingestion of all supported files in a directory.
    Runs in background to avoid timeout on large directories.
    """
    result = await ingest_service.ingest_directory(req.directory)
    return IngestResponse(**result)


@router.post("/files", response_model=IngestResponse)
async def ingest_uploaded_files(files: List[UploadFile] = File(...)):
    """Upload and ingest specific files."""
    tmp_dir = tempfile.mkdtemp()
    saved_paths = []
    try:
        for upload in files:
            dest = os.path.join(tmp_dir, upload.filename)
            with open(dest, "wb") as f:
                content = await upload.read()
                f.write(content)
            saved_paths.append(dest)

        result = await ingest_service.ingest_files(saved_paths)
        return IngestResponse(**result)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@router.get("/status")
async def ingest_status():
    """Get vector store stats."""
    info = ingest_service.get_vector_store_info()
    return info
