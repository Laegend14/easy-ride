import { describe, it, expect } from "vitest";
import { canTransition, stageStatus, mapProviderStatus } from "./lifecycle";

describe("canTransition", () => {
  it("allows valid forward steps and rejects skips", () => {
    expect(canTransition("provider_selected", "booking_confirmed")).toBe(true);
    expect(canTransition("payment_secured", "driver_assigned")).toBe(true);
    expect(canTransition("destination_reached", "settled")).toBe(true);
    expect(canTransition("provider_selected", "settled")).toBe(false);
    expect(canTransition("settled", "booking_confirmed")).toBe(false);
  });
});

describe("stageStatus", () => {
  it("maps stages to RideStatus", () => {
    expect(stageStatus("payment_secured")).toBe("ESCROW_FUNDED");
    expect(stageStatus("destination_reached")).toBe("COMPLETED");
    expect(stageStatus("settled")).toBe("SETTLED");
  });
});

describe("mapProviderStatus", () => {
  it("maps each provider status to a stage", () => {
    expect(mapProviderStatus("accepted")).toBe("driver_assigned");
    expect(mapProviderStatus("driver_approaching")).toBe("driver_approaching");
    expect(mapProviderStatus("in_progress")).toBe("ride_in_progress");
    expect(mapProviderStatus("completed")).toBe("destination_reached");
    expect(mapProviderStatus("cancelled")).toBe("provider_selected");
  });
});
