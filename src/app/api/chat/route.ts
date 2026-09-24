import { NextRequest, NextResponse } from "next/server";
import { askMobilityAssistant } from "@/lib/agent/chat-assistant";

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const reply = await askMobilityAssistant(message, context);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ reply: "I am ready to help you plan or track your rides. Type your destination above!" });
  }
}
