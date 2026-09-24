// Easy Ride AI Dispute Resolution & Human Support Escalation Service

import { analyzeDisputeSentiment, type DisputeSentimentResult } from "@/lib/huggingface/client";

export type DisputeCategory =
  | "driver_no_show"
  | "late_arrival"
  | "route_deviation"
  | "unsafe_driving"
  | "overcharge"
  | "vehicle_condition"
  | "lost_item";

export interface DisputeRecord {
  id: string;
  bookingId: string;
  userId: string;
  category: DisputeCategory;
  description: string;
  sentimentAnalysis: DisputeSentimentResult;
  status: "ai_refunded" | "escalated_to_human" | "under_review";
  refundAmountCents: number;
  aiExplanation: string;
  ticketId?: string;
  createdAt: string;
}

// In-memory support ticket queue for simulated human support agents
export interface SupportTicket {
  ticketId: string;
  disputeId: string;
  bookingId: string;
  userId: string;
  category: DisputeCategory;
  severity: "high" | "critical" | "medium";
  description: string;
  status: "open" | "in_investigation" | "resolved";
  assignedAgent: string;
  createdAt: string;
}

const SUPPORT_TICKET_QUEUE: SupportTicket[] = [
  {
    ticketId: "TICK-9081",
    disputeId: "disp-101",
    bookingId: "book-sample-1",
    userId: "usr-402",
    category: "unsafe_driving",
    severity: "critical",
    description: "Driver was speeding through residential zone and ignoring traffic signals.",
    status: "in_investigation",
    assignedAgent: "Sarah J. (Safety Operations)",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export async function processDispute(params: {
  bookingId: string;
  userId: string;
  category: DisputeCategory;
  description: string;
  fareCents: number;
}): Promise<DisputeRecord> {
  const { bookingId, userId, category, description, fareCents } = params;

  // 1. Run Hugging Face sentiment & severity analysis
  const sentiment = await analyzeDisputeSentiment(description);

  const disputeId = `disp_${Date.now()}`;
  let status: "ai_refunded" | "escalated_to_human" | "under_review" = "under_review";
  let refundAmountCents = 0;
  let aiExplanation = "";
  let ticketId: string | undefined = undefined;

  // 2. Automated Rule Arbitration Engine
  if (category === "driver_no_show" || category === "late_arrival" || sentiment.recommendedAction === "auto_refund") {
    // Instant automated full refund
    status = "ai_refunded";
    refundAmountCents = fareCents;
    aiExplanation = `Easy Ride AI validated your complaint (${category.replace("_", " ")}). A full refund of $${(fareCents / 100).toFixed(2)} has been credited to your balance.`;
  } else {
    // Escalated to Human Support Desk
    status = "escalated_to_human";
    ticketId = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
    aiExplanation = `Your issue requires human safety review. We have created Ticket #${ticketId}. A support specialist will contact you within 15 minutes.`;

    SUPPORT_TICKET_QUEUE.unshift({
      ticketId,
      disputeId,
      bookingId,
      userId,
      category,
      severity: sentiment.isSafetyRisk ? "critical" : "high",
      description,
      status: "open",
      assignedAgent: "Alex M. (Priority Dispatch Desk)",
      createdAt: new Date().toISOString(),
    });
  }

  return {
    id: disputeId,
    bookingId,
    userId,
    category,
    description,
    sentimentAnalysis: sentiment,
    status,
    refundAmountCents,
    aiExplanation,
    ticketId,
    createdAt: new Date().toISOString(),
  };
}

export function getSupportTickets(): SupportTicket[] {
  return SUPPORT_TICKET_QUEUE;
}
