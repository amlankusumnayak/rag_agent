// src/components/chat/ChatInput.tsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<Props> = ({ onSend, isLoading, disabled }) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        padding: "12px 16px",
        background: "#070d1a",
        borderTop: "1px solid #0f1a30",
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your files or database…"
        rows={1}
        disabled={disabled || isLoading}
        style={{
          flex: 1,
          resize: "none",
          background: "#0a1220",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: "11px 16px",
          color: "#e2e8f0",
          fontSize: 14,
          lineHeight: 1.5,
          outline: "none",
          transition: "border-color 0.2s",
          height: 44,
          minHeight: 44,
          maxHeight: 160,
          fontFamily: "inherit",
          overflowY: "auto",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
        onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading || disabled}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "none",
          cursor: !value.trim() || isLoading || disabled ? "not-allowed" : "pointer",
          background:
            !value.trim() || isLoading || disabled
              ? "#1e293b"
              : "linear-gradient(135deg, #6366f1, #7c3aed)",
          color: !value.trim() || isLoading || disabled ? "#475569" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        {isLoading ? (
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Send size={18} />
        )}
      </button>
    </div>
  );
};
