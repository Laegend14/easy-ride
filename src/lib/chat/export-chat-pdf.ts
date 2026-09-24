/**
 * export-chat-pdf.ts
 * Downloads the messages of a single ChatSession as a nicely formatted PDF.
 * Uses the browser's built-in print/PDF pipeline via a hidden iframe — zero
 * extra npm dependencies required.
 */

import type { ChatSession } from "@/lib/firebase/chat-history";

export function exportChatToPdf(session: ChatSession): void {
  const html = buildHtml(session);

  // Write to a hidden iframe so we can call window.print() in its context
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:800px;height:1px;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  // Give the iframe a moment to render fonts then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // Remove iframe after a delay
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }
  }, 500);
}

function formatTs(session: ChatSession): string {
  if (!session.startedAt) return "—";
  const d =
    typeof session.startedAt === "object" && "toDate" in session.startedAt
      ? (session.startedAt as any).toDate()
      : new Date(session.startedAt as any);
  return d.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildHtml(session: ChatSession): string {
  const rows = session.messages
    .map((m) => {
      const isUser = m.sender === "user";
      const bubble = isUser
        ? `<div class="bubble user-bubble"><p>${esc(m.text)}</p><span class="ts">${esc(m.timestamp)}</span></div>`
        : `<div class="bubble ai-bubble"><p>${esc(m.text)}</p><span class="ts">${esc(m.timestamp)}</span></div>`;
      return `<div class="row ${isUser ? "user-row" : "ai-row"}">${bubble}</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Easy Ride Chat — ${esc(session.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a2e;
      padding: 40px 48px;
      font-size: 13px;
      line-height: 1.6;
    }

    /* ── Header ── */
    .pdf-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 28px;
    }
    .logo-circle {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 18px;
    }
    .header-info h1 { font-size: 17px; font-weight: 600; }
    .header-info p  { font-size: 12px; color: #6b7280; margin-top: 3px; }

    /* ── Messages ── */
    .messages { display: flex; flex-direction: column; gap: 14px; }

    .row { display: flex; }
    .user-row { justify-content: flex-end; }
    .ai-row   { justify-content: flex-start; }

    .bubble {
      max-width: 68%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13px;
    }
    .user-bubble {
      background: #7c3aed;
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .ai-bubble {
      background: #f3f4f6;
      color: #1a1a2e;
      border-bottom-left-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    .ts {
      display: block;
      font-size: 10px;
      margin-top: 4px;
      opacity: 0.55;
      text-align: right;
    }

    /* ── Footer ── */
    .pdf-footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }

    @media print {
      body { padding: 20px 28px; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="logo-circle">ER</div>
    <div class="header-info">
      <h1>Easy Ride — AI Concierge Chat</h1>
      <p>${esc(session.title)} &nbsp;·&nbsp; ${formatTs(session)}</p>
    </div>
  </div>

  <div class="messages">
    ${rows}
  </div>

  <div class="pdf-footer">
    Easy Ride &copy; ${new Date().getFullYear()} &nbsp;·&nbsp; Exported on ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br />");
}
