// src/components/sidebar/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { Plus, MessageSquare, Upload, FolderOpen, Trash2, Database, FileText, Activity } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { ingestApi, healthApi } from "@/services/api";
import type { IngestStatus } from "@/types";

export const Sidebar: React.FC = () => {
  const { sessions, activeSessionId, setActiveSession, createSession, deleteSession } =
    useChatStore();
  const [docCount, setDocCount] = useState<number | null>(null);
  const [ingestDir, setIngestDir] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState("");
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "ingest">("chats");

  useEffect(() => {
    healthApi.check().then(() => setHealthOk(true)).catch(() => setHealthOk(false));
    ingestApi.getStatus().then((s: IngestStatus) => setDocCount(s.count)).catch(() => {});
  }, []);

  const handleDirectoryIngest = async () => {
    setIngesting(true);
    setIngestMsg("");
    try {
      const res = await ingestApi.ingestDirectory(ingestDir || undefined);
      setIngestMsg(`✓ ${res.files_parsed} files → ${res.chunks_added} chunks indexed`);
      const s = await ingestApi.getStatus();
      setDocCount(s.count);
    } catch {
      setIngestMsg("✗ Ingestion failed — check backend logs");
    } finally {
      setIngesting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIngesting(true);
    setIngestMsg("");
    try {
      const res = await ingestApi.uploadFiles(files);
      setIngestMsg(`✓ ${res.files_parsed} files → ${res.chunks_added} chunks indexed`);
      const s = await ingestApi.getStatus();
      setDocCount(s.count);
    } catch {
      setIngestMsg("✗ Upload failed");
    } finally {
      setIngesting(false);
      e.target.value = "";
    }
  };

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: "#070d1a",
        borderRight: "1px solid #0f1a30",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "18px 16px 14px",
          borderBottom: "1px solid #0f1a30",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Database size={14} color="#fff" />
          </div>
          <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, letterSpacing: "0.03em" }}>
            RAG Agent
          </span>
          <span
            style={{
              marginLeft: "auto",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: healthOk === null ? "#475569" : healthOk ? "#22c55e" : "#ef4444",
              boxShadow: healthOk ? "0 0 6px #22c55e88" : "none",
            }}
          />
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#0a1220",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "7px 10px",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#818cf8" }}>
              {docCount ?? "—"}
            </div>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.05em" }}>CHUNKS</div>
          </div>
          <div
            style={{
              flex: 1,
              background: "#0a1220",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "7px 10px",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#34d399" }}>
              {sessions.length}
            </div>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.05em" }}>CHATS</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #0f1a30",
          background: "#070d1a",
        }}
      >
        {(["chats", "ingest"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
              color: activeTab === tab ? "#818cf8" : "#334155",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "all 0.15s",
            }}
          >
            {tab === "chats" ? "Chats" : "Ingest"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "chats" ? (
          <>
            <div style={{ padding: "10px 12px" }}>
              <button
                onClick={createSession}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px dashed #1e293b",
                  background: "none",
                  color: "#475569",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#4f46e5";
                  (e.currentTarget as HTMLButtonElement).style.color = "#818cf8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e293b";
                  (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                }}
              >
                <Plus size={14} />
                New chat
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 10px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background:
                      session.id === activeSessionId ? "#0f1a30" : "none",
                    border:
                      session.id === activeSessionId
                        ? "1px solid #1e3a5f"
                        : "1px solid transparent",
                    marginBottom: 3,
                    transition: "all 0.15s",
                  }}
                >
                  <MessageSquare size={13} color={session.id === activeSessionId ? "#6366f1" : "#334155"} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: session.id === activeSessionId ? "#cbd5e1" : "#475569",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 2,
                      cursor: "pointer",
                      color: "#1e293b",
                      opacity: 0,
                      transition: "opacity 0.15s",
                      display: "flex",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                      (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0";
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Upload files */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#334155",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Upload Files
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px dashed #1e293b",
                  cursor: "pointer",
                  color: "#475569",
                  fontSize: 12,
                  transition: "all 0.15s",
                }}
              >
                <Upload size={13} />
                <span>Choose files…</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {/* Directory ingest */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#334155",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Ingest Directory
              </label>
              <input
                value={ingestDir}
                onChange={(e) => setIngestDir(e.target.value)}
                placeholder="C:\\Users\\…\\Documents"
                style={{
                  width: "100%",
                  background: "#0a1220",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: "#cbd5e1",
                  fontSize: 11,
                  outline: "none",
                  marginBottom: 8,
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
              />
              <button
                onClick={handleDirectoryIngest}
                disabled={ingesting}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "9px",
                  borderRadius: 10,
                  border: "none",
                  background: ingesting ? "#1e293b" : "linear-gradient(135deg, #6366f1, #7c3aed)",
                  color: ingesting ? "#475569" : "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: ingesting ? "not-allowed" : "pointer",
                }}
              >
                <FolderOpen size={13} />
                {ingesting ? "Indexing…" : "Index Directory"}
              </button>
            </div>

            {ingestMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: ingestMsg.startsWith("✓") ? "#052e16" : "#2d0a0a",
                  border: `1px solid ${ingestMsg.startsWith("✓") ? "#166534" : "#7f1d1d"}`,
                  color: ingestMsg.startsWith("✓") ? "#86efac" : "#fca5a5",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                {ingestMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid #0f1a30",
          fontSize: 10,
          color: "#1e293b",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Activity size={10} />
        LangGraph · LangChain · ChromaDB · MySQL
      </div>
    </div>
  );
};
