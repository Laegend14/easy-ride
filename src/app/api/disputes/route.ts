import { NextRequest, NextResponse } from "next/server";
import { processDispute, type DisputeCategory } from "@/lib/disputes/dispute-service";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, category, description, fareCents } = await req.json();

    if (!bookingId || !category || !description) {
      return NextResponse.json({ error: "Missing dispute information" }, { status: 400 });
    }

    const record = await processDispute({
      bookingId,
      userId: "current-user",
      category: category as DisputeCategory,
      description,
      fareCents: fareCents || 2500,
    });

    return NextResponse.json({ dispute: record });
  } catch (err: any) {
    console.error("[/api/disputes] error:", err);
    return NextResponse.json({ error: "Failed to process dispute" }, { status: 500 });
  }
}
