"""
utils/file_parser.py — Parse various file types into plain text chunks.
Uses Python 3.14 concurrent.futures for parallel file processing.
"""
import asyncio
import mimetypes
import os
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import List, Dict, Any

from core.logging import get_logger

logger = get_logger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx", ".html"}


# ── Pure functions run inside worker processes ────────────────────────────────

def _parse_pdf(path: str) -> str:
    from pypdf import PdfReader
    reader = PdfReader(path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _parse_docx(path: str) -> str:
    from docx import Document
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def _parse_csv(path: str) -> str:
    import pandas as pd
    df = pd.read_csv(path)
    return df.to_string(index=False)


def _parse_xlsx(path: str) -> str:
    import pandas as pd
    xl = pd.ExcelFile(path)
    parts = []
    for sheet in xl.sheet_names:
        df = xl.parse(sheet)
        parts.append(f"=== Sheet: {sheet} ===\n{df.to_string(index=False)}")
    return "\n\n".join(parts)


def _parse_text(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def _parse_file_sync(path: str) -> Dict[str, Any]:
    """Called in a worker process — returns metadata + content."""
    p = Path(path)
    ext = p.suffix.lower()
    try:
        if ext == ".pdf":
            content = _parse_pdf(path)
        elif ext == ".docx":
            content = _parse_docx(path)
        elif ext in {".csv"}:
            content = _parse_csv(path)
        elif ext in {".xlsx"}:
            content = _parse_xlsx(path)
        elif ext in {".txt", ".md", ".html"}:
            content = _parse_text(path)
        else:
            content = ""

        return {
            "path": path,
            "filename": p.name,
            "extension": ext,
            "content": content,
            "size": p.stat().st_size,
            "error": None,
        }
    except Exception as e:
        return {"path": path, "filename": p.name, "content": "", "error": str(e)}


# ── Async wrapper using ProcessPoolExecutor ───────────────────────────────────

async def parse_files_parallel(file_paths: List[str]) -> List[Dict[str, Any]]:
    """
    Parse a list of files in parallel using multiple processes (Python 3.14).
    Returns list of dicts with content and metadata.
    """
    loop = asyncio.get_event_loop()
    max_workers = min(os.cpu_count() or 4, len(file_paths), 8)

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        tasks = [
            loop.run_in_executor(executor, _parse_file_sync, path)
            for path in file_paths
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    parsed = []
    for r in results:
        if isinstance(r, Exception):
            logger.error(f"File parse exception: {r}")
        else:
            if r.get("error"):
                logger.warning(f"Parse error for {r['filename']}: {r['error']}")
            else:
                parsed.append(r)

    logger.info(f"Parsed {len(parsed)}/{len(file_paths)} files successfully")
    return parsed


def discover_files(base_dir: str) -> List[str]:
    """Recursively find all supported files under base_dir."""
    found = []
    for root, _, files in os.walk(base_dir):
        for fname in files:
            if Path(fname).suffix.lower() in SUPPORTED_EXTENSIONS:
                found.append(os.path.join(root, fname))
    return found
