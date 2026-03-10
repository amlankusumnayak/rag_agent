"""
utils/chunker.py — Split parsed text into overlapping chunks for embedding.
"""
from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter


CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150


def chunk_documents(parsed_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Takes a list of parsed file dicts and returns a flat list of chunk dicts
    ready for embedding and storage in ChromaDB.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    chunks: List[Dict[str, Any]] = []
    for doc in parsed_files:
        if not doc.get("content"):
            continue
        parts = splitter.split_text(doc["content"])
        for i, part in enumerate(parts):
            chunks.append({
                "text": part,
                "metadata": {
                    "source": doc["path"],
                    "filename": doc["filename"],
                    "extension": doc.get("extension", ""),
                    "chunk_index": i,
                    "total_chunks": len(parts),
                },
            })

    return chunks
