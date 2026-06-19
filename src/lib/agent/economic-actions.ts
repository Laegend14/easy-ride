// The agent's economic actions, abstracted behind an interface so the decision
// logic can be built and tested now. M11 supplies the real on-chain
// implementation (EasyRideEscrow.sol on Arc Testnet); to users these are always
// described as "Protected Payment" / "Secure Ride Lock".

export interface EscrowRecord {
  escrowId: string;
  amountCents: number;
  state: "created" | "funded" | "released" | "refunded" | "reassigned";
  bookingRef: string;
}

export interface EconomicActions {
  createEscrow(bookingRef: string, amountCents: number): Promise<EscrowRecord>;
  lockFunds(escrowId: string): Promise<EscrowRecord>;
  releasePayment(escrowId: string): Promise<EscrowRecord>;
  issueRefund(escrowId: string): Promise<EscrowRecord>;
  /** Move a funded escrow to a replacement booking after a cancellation. */
  reassignEscrow(escrowId: string, newBookingRef: string): Promise<EscrowRecord>;
}

/** Deterministic in-memory implementation for development and tests. */
export class MockEconomicActions implements EconomicActions {
  private store = new Map<string, EscrowRecord>();
  private seq = 0;

  private id(prefix: string, key: string): string {
    // Deterministic id (no Date/random) so runs are reproducible.
    this.seq += 1;
    return `${prefix}_${key}_${this.seq}`;
  }

  async createEscrow(bookingRef: string, amountCents: number): Promise<EscrowRecord> {
    const record: EscrowRecord = {
      escrowId: this.id("esc", bookingRef),
      amountCents,
      state: "created",
      bookingRef,
    };
    this.store.set(record.escrowId, record);
    return record;
  }

  async lockFunds(escrowId: string): Promise<EscrowRecord> {
    return this.update(escrowId, "funded");
  }

  async releasePayment(escrowId: string): Promise<EscrowRecord> {
    return this.update(escrowId, "released");
  }

  async issueRefund(escrowId: string): Promise<EscrowRecord> {
    return this.update(escrowId, "refunded");
  }

  async reassignEscrow(escrowId: string, newBookingRef: string): Promise<EscrowRecord> {
    const record = this.require(escrowId);
    record.bookingRef = newBookingRef;
    record.state = "reassigned";
    this.store.set(escrowId, record);
    return record;
  }

  private require(escrowId: string): EscrowRecord {
    const record = this.store.get(escrowId);
    if (!record) throw new Error(`Unknown escrow: ${escrowId}`);
    return record;
  }

  private update(escrowId: string, state: EscrowRecord["state"]): EscrowRecord {
    const record = this.require(escrowId);
    record.state = state;
    this.store.set(escrowId, record);
    return record;
  }
}
