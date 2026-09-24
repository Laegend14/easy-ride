import { describe, it, expect } from "vitest";
import { processDispute, getSupportTickets } from "./dispute-service";

describe("AI Dispute Resolution Engine", () => {
  it("automatically refunds clear driver no-show disputes", async () => {
    const dispute = await processDispute({
      bookingId: "test-booking-1",
      userId: "test-user-1",
      category: "driver_no_show",
      description: "Driver never arrived at pickup location.",
      fareCents: 2450,
    });

    expect(dispute.status).toBe("ai_refunded");
    expect(dispute.refundAmountCents).toBe(2450);
    expect(dispute.aiExplanation).toContain("validated your complaint");
  });

  it("escalates severe safety complaints to human support queue", async () => {
    const dispute = await processDispute({
      bookingId: "test-booking-2",
      userId: "test-user-2",
      category: "unsafe_driving",
      description: "Driver was speeding dangerously and almost caused an accident crash.",
      fareCents: 3200,
    });

    expect(dispute.status).toBe("escalated_to_human");
    expect(dispute.ticketId).toBeDefined();
    expect(dispute.ticketId).toMatch(/^TICK-\d+/);

    const tickets = getSupportTickets();
    const createdTicket = tickets.find((t) => t.ticketId === dispute.ticketId);
    expect(createdTicket).toBeDefined();
    expect(createdTicket?.severity).toBe("critical");
  });
});
