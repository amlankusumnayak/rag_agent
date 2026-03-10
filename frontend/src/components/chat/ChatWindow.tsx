// src/components/chat/ChatWindow.tsx
import React, { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChatStore } from "@/store/chatStore";
import { Sparkles, Trash2 } from "lucide-react";

const SUGGESTIONS = [
  "What documents have you indexed?",
  "Summarize the key points from my files",
  "Show me all tables in the database",
  "How many records are in each table?",
];

export const ChatWindow: React.FC = () => {
  const { messages, activeSessionId, isLoading, sendMessage, clearSession } =
    useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMessages = messages[activeSessionId] || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#050b15",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid #0f1a30",
          background: "#070d1a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={16} color="#6366f1" />
          <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15, letterSpacing: "0.02em" }}>
            RAG Agent
          </span>
          <span
            style={{
              background: "#0f1729",
              border: "1px solid #1e293b",
              borderRadius: 20,
              padding: "1px 8px",
              fontSize: 10,
              color: "#64748b",
              letterSpacing: "0.05em",
            }}
          >
            llama3 · Ollama
          </span>
        </div>
        {currentMessages.length > 0 && (
          <button
            onClick={clearSession}
            title="Clear chat"
            style={{
              background: "none",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "5px 10px",
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e293b";
              (e.currentTarget as HTMLButtonElement).style.color = "#475569";
            }}
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {currentMessages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              color: "#334155",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 0 40px #6366f130",
                }}
              >
                <Sparkles size={24} color="#fff" />
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "#94a3b8", margin: "0 0 6px" }}>
                Ask anything
              </p>
              <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>
                Query your files and database in plain English
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                maxWidth: 480,
                width: "100%",
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    background: "#0a1220",
                    border: "1px solid #1e293b",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "#64748b",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    lineHeight: 1.4,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#4f46e5";
                    (e.currentTarget as HTMLButtonElement).style.color = "#818cf8";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e293b";
                    (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentMessages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
};
