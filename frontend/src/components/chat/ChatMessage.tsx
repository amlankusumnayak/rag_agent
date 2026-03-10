// src/components/chat/ChatMessage.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Database, FileText, GitBranch, Loader2 } from "lucide-react";
import type { Message, RouteType } from "@/types";

interface Props {
  message: Message;
}

const routeLabel: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  vector: { label: "Docs", icon: <FileText size={11} />, color: "#6ee7b7" },
  sql: { label: "SQL", icon: <Database size={11} />, color: "#93c5fd" },
  both: { label: "Docs + SQL", icon: <GitBranch size={11} />, color: "#f9a8d4" },
  direct: { label: "Direct", icon: null, color: "#d1d5db" },
  unknown: { label: "—", icon: null, color: "#d1d5db" },
};

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: "12px",
        alignItems: "flex-start",
        padding: "6px 0",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          background: isUser
            ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          color: "#fff",
          border: isUser ? "none" : "1px solid #1e3a5f",
        }}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "75%", minWidth: 60 }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            background: isUser ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "#0f1729",
            border: isUser ? "none" : "1px solid #1e293b",
            color: isUser ? "#fff" : "#cbd5e1",
            fontSize: 14,
            lineHeight: 1.65,
          }}
        >
          {message.isLoading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8" }}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              Thinking...
            </span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  return isBlock ? (
                    <pre
                      style={{
                        background: "#0a0f1a",
                        border: "1px solid #1e293b",
                        borderRadius: 8,
                        padding: "12px",
                        overflowX: "auto",
                        fontSize: 12,
                        margin: "8px 0",
                      }}
                    >
                      <code>{children}</code>
                    </pre>
                  ) : (
                    <code
                      style={{
                        background: "#1e293b",
                        borderRadius: 4,
                        padding: "1px 5px",
                        fontSize: 12,
                        color: "#7dd3fc",
                      }}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p style={{ margin: "0 0 8px 0" }}>{children}</p>,
                ul: ({ children }) => (
                  <ul style={{ margin: "4px 0", paddingLeft: 20 }}>{children}</ul>
                ),
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", margin: "8px 0" }}>
                    <table
                      style={{
                        borderCollapse: "collapse",
                        fontSize: 12,
                        width: "100%",
                      }}
                    >
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th
                    style={{
                      border: "1px solid #1e293b",
                      padding: "6px 10px",
                      background: "#0a0f1a",
                      color: "#7dd3fc",
                      textAlign: "left",
                    }}
                  >
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td
                    style={{
                      border: "1px solid #1e293b",
                      padding: "6px 10px",
                    }}
                  >
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Meta: route + sources */}
        {!isUser && !message.isLoading && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 6,
              paddingLeft: 4,
            }}
          >
            {message.route && routeLabel[message.route] && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "#0f1729",
                  border: `1px solid ${routeLabel[message.route].color}33`,
                  color: routeLabel[message.route].color,
                  letterSpacing: "0.05em",
                }}
              >
                {routeLabel[message.route].icon}
                {routeLabel[message.route].label}
              </span>
            )}
            {message.sources?.map((src) => (
              <span
                key={src}
                title={src}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 10,
                  background: "#0f1729",
                  border: "1px solid #1e293b",
                  color: "#64748b",
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <FileText size={9} />
                {src}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: 10,
            color: "#334155",
            marginTop: 4,
            paddingLeft: 4,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
};
