"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  X,
  Download,
  MessageSquareDashed,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { listChatSessions, getChatSession, type ChatSession } from "@/lib/firebase/chat-history";
import { exportChatToPdf } from "@/lib/chat/export-chat-pdf";

interface Props {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user clicks a session to reopen it */
  onRestoreSession: (session: ChatSession) => void;
}

function formatRelative(ts: any): string {
  if (!ts) return "";
  const d = typeof ts === "object" && "toDate" in ts ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatHistoryPanel({ userId, isOpen, onClose, onRestoreSession }: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    listChatSessions(userId)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  const handleExport = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setExportingId(session.id);
    try {
      // If messages were not already fetched (from the list query), fetch the full doc
      const full =
        session.messages?.length > 0
          ? session
          : await getChatSession(userId, session.id);
      if (full) exportChatToPdf(full);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="history-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] max-h-[480px] rounded-3xl bg-surface/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet/20 flex items-center justify-center">
                <History className="w-4 h-4 text-violet" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Chat History</h3>
                <p className="text-[10px] text-muted mt-0.5">
                  {sessions.length} conversation{sessions.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition"
              aria-label="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
                <Loader2 className="w-6 h-6 animate-spin text-violet" />
                <span className="text-xs">Loading conversations…</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
                <MessageSquareDashed className="w-10 h-10 opacity-30" />
                <p className="text-xs text-center">
                  No saved conversations yet.
                  <br />
                  Start chatting and they'll appear here.
                </p>
              </div>
            ) : (
              sessions.map((s) => (
                <motion.div
                  key={s.id}
                  whileHover={{ x: 2 }}
                  onClick={() => { onRestoreSession(s); onClose(); }}
                  className="group relative flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] hover:border-violet/30 cursor-pointer transition-all"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-xl bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquareDashed className="w-4 h-4 text-violet" />
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-snug">
                      {s.title}
                    </p>
                    <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelative(s.updatedAt)}
                      <span className="opacity-40">·</span>
                      {(s.messages?.length ?? 0)} msg{(s.messages?.length ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Export PDF */}
                    <button
                      onClick={(e) => handleExport(e, s)}
                      className="p-1.5 rounded-lg text-muted hover:text-teal hover:bg-teal/10 transition opacity-0 group-hover:opacity-100"
                      title="Download as PDF"
                      aria-label="Export PDF"
                    >
                      {exportingId === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-muted/40 group-hover:text-violet transition" />
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] shrink-0">
            <p className="text-[10px] text-muted/60 text-center">
              Click a conversation to reopen it · Hover to export PDF
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
