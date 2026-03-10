// src/store/chatStore.ts
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Message, Session } from "@/types";
import { chatApi } from "@/services/api";

interface ChatStore {
  sessions: Session[];
  activeSessionId: string;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  createSession: () => string;
  setActiveSession: (id: string) => void;
  sendMessage: (question: string) => Promise<void>;
  clearSession: () => Promise<void>;
  deleteSession: (id: string) => void;
}

const makeSession = (): Session => ({
  id: uuidv4(),
  title: "New Chat",
  createdAt: new Date(),
  lastMessageAt: new Date(),
  messageCount: 0,
});

const initialSession = makeSession();

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [initialSession],
  activeSessionId: initialSession.id,
  messages: { [initialSession.id]: [] },
  isLoading: false,
  error: null,

  createSession: () => {
    const session = makeSession();
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: session.id,
      messages: { ...s.messages, [session.id]: [] },
    }));
    return session.id;
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  sendMessage: async (question: string) => {
    const { activeSessionId, messages, sessions } = get();
    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    const loadingMsg: Message = {
      id: uuidv4(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    set({
      isLoading: true,
      error: null,
      messages: {
        ...messages,
        [activeSessionId]: [
          ...(messages[activeSessionId] || []),
          userMsg,
          loadingMsg,
        ],
      },
    });

    // Update session title from first message
    const currentMsgs = messages[activeSessionId] || [];
    if (currentMsgs.length === 0) {
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === activeSessionId
            ? { ...sess, title: question.slice(0, 40) }
            : sess
        ),
      }));
    }

    try {
      const res = await chatApi.send({
        question,
        session_id: activeSessionId,
      });

      const assistantMsg: Message = {
        id: loadingMsg.id,
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        route: res.route,
        timestamp: new Date(),
        isLoading: false,
      };

      set((s) => ({
        isLoading: false,
        messages: {
          ...s.messages,
          [activeSessionId]: s.messages[activeSessionId].map((m) =>
            m.id === loadingMsg.id ? assistantMsg : m
          ),
        },
        sessions: s.sessions.map((sess) =>
          sess.id === activeSessionId
            ? {
                ...sess,
                lastMessageAt: new Date(),
                messageCount: sess.messageCount + 2,
              }
            : sess
        ),
      }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Request failed";
      set((s) => ({
        isLoading: false,
        error: errMsg,
        messages: {
          ...s.messages,
          [activeSessionId]: s.messages[activeSessionId].filter(
            (m) => m.id !== loadingMsg.id
          ),
        },
      }));
    }
  },

  clearSession: async () => {
    const { activeSessionId } = get();
    await chatApi.clearHistory(activeSessionId).catch(() => {});
    set((s) => ({
      messages: { ...s.messages, [activeSessionId]: [] },
      sessions: s.sessions.map((sess) =>
        sess.id === activeSessionId
          ? { ...sess, title: "New Chat", messageCount: 0 }
          : sess
      ),
    }));
  },

  deleteSession: (id: string) => {
    const { sessions, activeSessionId, messages } = get();
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const newSession = makeSession();
      set({
        sessions: [newSession],
        activeSessionId: newSession.id,
        messages: { [newSession.id]: [] },
      });
      return;
    }
    const newActive =
      id === activeSessionId ? remaining[0].id : activeSessionId;
    const newMessages = { ...messages };
    delete newMessages[id];
    set({ sessions: remaining, activeSessionId: newActive, messages: newMessages });
  },
}));
