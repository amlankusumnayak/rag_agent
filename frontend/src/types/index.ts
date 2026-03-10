// src/types/index.ts

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  route?: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

export interface ChatRequest {
  question: string;
  session_id?: string;
}

export interface ChatResponse {
  session_id: string;
  question: string;
  answer: string;
  sources: string[];
  route: string;
}

export interface IngestStatus {
  count: number;
  name: string;
}

export interface IngestResult {
  status: string;
  files_found?: number;
  files_parsed?: number;
  chunks_added: number;
}

export type RouteType = "vector" | "sql" | "both" | "direct" | "unknown";
