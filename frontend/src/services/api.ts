// src/services/api.ts
import axios from "axios";
import type { ChatRequest, ChatResponse, IngestStatus, IngestResult } from "@/types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const chatApi = {
  send: (req: ChatRequest): Promise<ChatResponse> =>
    api.post<ChatResponse>("/chat/", req).then((r) => r.data),

  getHistory: (sessionId: string) =>
    api.get(`/chat/history/${sessionId}`).then((r) => r.data),

  clearHistory: (sessionId: string) =>
    api.delete(`/chat/history/${sessionId}`).then((r) => r.data),
};

export const ingestApi = {
  getStatus: (): Promise<IngestStatus> =>
    api.get<IngestStatus>("/ingest/status").then((r) => r.data),

  ingestDirectory: (directory?: string): Promise<IngestResult> =>
    api
      .post<IngestResult>("/ingest/directory", { directory })
      .then((r) => r.data),

  uploadFiles: (files: File[]): Promise<IngestResult> => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return api
      .post<IngestResult>("/ingest/files", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export const healthApi = {
  check: () => api.get("/health/").then((r) => r.data),
};
