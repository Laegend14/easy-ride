import { describe, it, expect } from "vitest";
import { ethers } from "ethers";
import { centsToWei, centsToUsdcString } from "./escrow-client";

// The escrow contract's fundRideEscrow reverts unless msg.value EXACTLY equals
// the amount set at createRideEscrow. The rider funds via Circle with the string
// from centsToUsdcString; the create side locks centsToWei. These MUST be the
// same native value (Circle parses the decimal string as parseEther on Arc's
// 18-dp native USDC — verified live on testnet).
describe("escrow value conversion (true-dollar)", () => {
  const cases = [0, 1, 5, 99, 100, 250, 1050, 2000, 3999, 12345];

  it("centsToWei === parseEther(centsToUsdcString) for every fare", () => {
    for (const c of cases) {
      expect(centsToWei(c)).toBe(ethers.parseEther(centsToUsdcString(c)));
    }
  });

  it("100 cents = 1 USDC = 1e18 wei", () => {
    expect(centsToWei(100)).toBe(ethers.parseEther("1"));
    expect(centsToWei(2000)).toBe(ethers.parseEther("20"));
  });

  it("formats cents as a 2-decimal USDC string", () => {
    expect(centsToUsdcString(2000)).toBe("20.00");
    expect(centsToUsdcString(1050)).toBe("10.50");
    expect(centsToUsdcString(99)).toBe("0.99");
  });

  it("never returns a negative value", () => {
    expect(centsToWei(-500)).toBe(BigInt(0));
    expect(centsToUsdcString(-500)).toBe("0.00");
  });
});
