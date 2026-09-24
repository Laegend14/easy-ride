"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  History,
  Download,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, type User as FbUser } from "firebase/auth";
import {
  createChatSession,
  appendMessageToSession,
  type ChatSession,
  type ChatMessage,
} from "@/lib/firebase/chat-history";
import { ChatHistoryPanel } from "./chat-history-panel";
import { exportChatToPdf } from "@/lib/chat/export-chat-pdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const WELCOME: ChatMessage = {
  id: "welcome-1",
  sender: "assistant",
  text: "Hello! I'm your Easy Ride AI Assistant. Ask me to find rides, explain pricing, or handle a dispute.",
  timestamp: "Just now",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AiChatbot() {
  const [isOpen, setIsOpen]           = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [messages, setMessages]       = useState<ChatMessage[]>([WELCOME]);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [fbUser, setFbUser]           = useState<FbUser | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => setFbUser(u));
    return unsub;
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // ── Persist a message to Firebase (fire-and-forget) ──────────────────────
  const persistMessage = useCallback(
    async (msg: ChatMessage, currentSessionId: string | null, allMessages: ChatMessage[]) => {
      if (!fbUser) return currentSessionId;

      try {
        if (!currentSessionId) {
          // First real user message → create session
          const sid = await createChatSession(fbUser.uid, msg);
          return sid;
        } else {
          await appendMessageToSession(fbUser.uid, currentSessionId, msg);
          return currentSessionId;
        }
      } catch (err) {
        console.warn("[chat-history] Failed to persist message:", err);
        return currentSessionId;
      }
    },
    [fbUser]
  );

  // ── Send a message ───────────────────────────────────────────────────────
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: makeId("u"),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    // Persist user message
    const sid = await persistMessage(userMsg, sessionId, messages);
    if (sid && sid !== sessionId) setSessionId(sid);

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: makeId("a"),
        sender: "assistant",
        text: data.reply || "I am processing your mobility request.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Persist AI reply (sid already set from user msg step)
      await persistMessage(aiMsg, sid ?? sessionId, []);
    } catch {
      const errMsg: ChatMessage = {
        id: makeId("a-err"),
        sender: "assistant",
        text: "I can compare Uber, Bolt, and Lyft for your route. Enter your destination in the top search bar to begin!",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errMsg]);
      await persistMessage(errMsg, sid ?? sessionId, []);
    } finally {
      setLoading(false);
    }
  };

  // ── Start a new conversation ─────────────────────────────────────────────
  const handleNewChat = () => {
    setMessages([WELCOME]);
    setSessionId(null);
    setInput("");
    setShowHistory(false);
  };

  // ── Restore a session from history ───────────────────────────────────────
  const handleRestoreSession = (session: ChatSession) => {
    setMessages(session.messages?.length ? session.messages : [WELCOME]);
    setSessionId(session.id);
    setShowHistory(false);
    setIsOpen(true);
  };

  // ── Export current chat ──────────────────────────────────────────────────
  const handleExportCurrent = () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    const fakeSession: ChatSession = {
      id: sessionId ?? "unsaved",
      title: messages.find((m) => m.sender === "user")?.text.slice(0, 50) ?? "Chat Session",
      startedAt: null,
      updatedAt: null,
      messages,
    };
    exportChatToPdf(fakeSession);
    setTimeout(() => setExportingPdf(false), 1200);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Launcher */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsOpen(!isOpen); setShowHistory(false); }}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-brand text-white shadow-2xl border border-white/20 focus:outline-none"
          aria-label="Open AI Assistant"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-teal" />
            </span>
          )}
        </motion.button>
      </div>

      {/* History Panel */}
      {fbUser && (
        <ChatHistoryPanel
          userId={fbUser.uid}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRestoreSession={handleRestoreSession}
        />
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] h-[540px] rounded-3xl bg-surface/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-foreground"
          >
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-none">Easy Ride Concierge</h3>
                  <p className="text-[11px] text-teal mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                    Online • AI Mobility Assistant
                  </p>
                </div>
              </div>

              {/* Header action buttons */}
              <div className="flex items-center gap-1">
                {/* New Chat */}
                <button
                  onClick={handleNewChat}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition"
                  title="New conversation"
                  aria-label="Start new chat"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* History — only if user is logged in */}
                {fbUser && (
                  <button
                    onClick={() => { setShowHistory(!showHistory); }}
                    className={`p-1.5 rounded-lg transition ${
                      showHistory
                        ? "text-violet bg-violet/15"
                        : "text-muted hover:text-foreground hover:bg-white/5"
                    }`}
                    title="Chat history"
                    aria-label="View chat history"
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}

                {/* Export current chat as PDF */}
                <button
                  onClick={handleExportCurrent}
                  disabled={exportingPdf || messages.length <= 1}
                  className="p-1.5 rounded-lg text-muted hover:text-teal hover:bg-teal/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Download chat as PDF"
                  aria-label="Export chat as PDF"
                >
                  {exportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Message Body ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      m.sender === "user"
                        ? "bg-teal text-background font-semibold"
                        : "bg-white/10 text-teal"
                    }`}
                  >
                    {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 leading-relaxed text-sm ${
                      m.sender === "user"
                        ? "bg-teal text-background rounded-tr-none font-medium"
                        : "bg-white/[0.07] border border-white/10 text-foreground rounded-tl-none"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="block text-[9px] mt-1 opacity-60 text-right">{m.timestamp}</span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-teal" />
                  <span>Assistant is thinking…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* ── Quick Suggestions ────────────────────────────────────── */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/5 shrink-0">
              <button
                onClick={() => handleSend("How are payments protected?")}
                className="text-[11px] whitespace-nowrap bg-white/5 hover:bg-white/10 text-muted hover:text-foreground px-2.5 py-1 rounded-full border border-white/10 transition"
              >
                🛡️ Protected Payments
              </button>
              <button
                onClick={() => handleSend("I want to report an issue with my ride")}
                className="text-[11px] whitespace-nowrap bg-white/5 hover:bg-white/10 text-muted hover:text-foreground px-2.5 py-1 rounded-full border border-white/10 transition"
              >
                ⚠️ Report an Issue
              </button>
            </div>

            {/* ── Input Bar ────────────────────────────────────────────── */}
            <div className="p-3 border-t border-white/10 bg-black/20 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2 rounded-2xl bg-white/[0.07] border-2 border-teal/25 px-4 py-2.5 focus-within:border-teal/50 focus-within:bg-white/[0.10] transition-all"
              >
                <Sparkles className="w-4 h-4 text-teal/60 shrink-0" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message your AI concierge…"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/50 min-w-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="gradient"
                  disabled={loading || !input.trim()}
                  className="h-8 w-8 rounded-xl shrink-0 shadow-lg shadow-indigo/30"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
              <p className="text-center text-[10px] text-muted/40 mt-2">AI concierge · Powered by Gemini</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
