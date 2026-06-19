import { describe, it, expect } from "vitest";
import {
  clampText,
  sanitizeSingleLine,
  isPositiveAmount,
  isEvmAddress,
  dollarsToCents,
} from "./validate";

describe("clampText", () => {
  it("trims and caps length", () => {
    expect(clampText("  hello  ", 50)).toBe("hello");
    expect(clampText("abcdef", 3)).toBe("abc");
  });
  it("strips control characters (tab) to spaces", () => {
    expect(clampText("x\ty", 50)).toBe("x y");
  });
  it("handles non-strings", () => {
    expect(clampText(undefined, 10)).toBe("");
    expect(clampText(123, 10)).toBe("123");
  });
});

describe("sanitizeSingleLine", () => {
  it("collapses whitespace to single spaces", () => {
    expect(sanitizeSingleLine("a   b\t c")).toBe("a b c");
  });
});

describe("isPositiveAmount", () => {
  it("accepts positive finite numbers only", () => {
    expect(isPositiveAmount(1)).toBe(true);
    expect(isPositiveAmount(0)).toBe(false);
    expect(isPositiveAmount(-5)).toBe(false);
    expect(isPositiveAmount(Number.NaN)).toBe(false);
    expect(isPositiveAmount("5")).toBe(false);
  });
});

describe("isEvmAddress", () => {
  it("validates 0x + 40 hex", () => {
    expect(isEvmAddress("0xa1c1434f49626d48dfc2c3fe93c21c57c55461ca")).toBe(true);
    expect(isEvmAddress("0x123")).toBe(false);
    expect(isEvmAddress("a1c1434f49626d48dfc2c3fe93c21c57c55461ca")).toBe(false);
    expect(isEvmAddress(null)).toBe(false);
  });
});

describe("dollarsToCents", () => {
  it("parses dollars to integer cents", () => {
    expect(dollarsToCents("$12.34")).toBe(1234);
    expect(dollarsToCents("20")).toBe(2000);
    expect(dollarsToCents("junk")).toBe(0);
    expect(dollarsToCents("")).toBe(0);
  });
});
