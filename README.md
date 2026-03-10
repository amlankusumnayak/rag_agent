# RAG Agent — LangGraph + LangChain + Ollama

Full-stack Retrieval-Augmented Generation Agent with:
- **Backend**: FastAPI + async Python 3.14
- **Agentic System**: LangGraph + LangChain + Ollama (llama3)
- **Frontend**: React + TypeScript + Vite
- **Sources**: Files (PDF, DOCX, TXT, CSV, MD) + MySQL database

---

## Folder Structure

```
rag_agent/
├── backend/               # FastAPI application
│   ├── api/routes/        # HTTP route handlers
│   ├── core/              # Config, DB connections, logging
│   ├── services/          # Business logic bridging API <-> agentic system
│   └── utils/             # Helpers (file parsing, chunking)
│
├── agentic_system/        # LangGraph RAG agent
│   ├── agents/            # Agent node definitions
│   ├── tools/             # LangChain tools (retrieval, SQL, web)
│   ├── retrievers/        # Vector store + MySQL retrievers
│   ├── memory/            # Conversation memory
│   ├── graph/             # LangGraph StateGraph definition
│   └── config/            # Agent prompts and settings
│
└── frontend/              # React + TypeScript UI
    └── src/
        ├── components/    # chat/, sidebar/, ui/
        ├── hooks/         # Custom React hooks
        ├── services/      # API client
        ├── store/         # Zustand state
        └── types/         # TypeScript interfaces
```

---

## Quick Start

### 1. Prerequisites
- Python 3.14+
- Node.js 20+
- Ollama running locally with llama3: `ollama pull llama3`
- MySQL server running
- ChromaDB (auto-installed)

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill in your MySQL credentials
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### 4. Index your files
POST to `/api/ingest/files` with a folder path, or use the UI sidebar.

---

## Architecture

```
User Query
    │
    ▼
FastAPI  ──►  LangGraph Agent
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     File RAG    SQL RAG   Conversation
    (Chroma)    (MySQL)     Memory
          │         │
          └────┬────┘
               ▼
          Ollama llama3
               │
               ▼
          Final Answer
```
