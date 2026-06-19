// Arc Testnet block-explorer links. Plain helpers (no "server-only") so both
// server-side data builders (receipts) and client components can use them.

export const ARC_EXPLORER_BASE = "https://testnet.arcscan.app";

/** Explorer link for a payment record (transaction). */
export function arcTxUrl(hash: string): string {
  return `${ARC_EXPLORER_BASE}/tx/${hash}`;
}

/** Explorer link for an account address. */
export function arcAddressUrl(address: string): string {
  return `${ARC_EXPLORER_BASE}/address/${address}`;
}

/** Compact display form for a long hex id, e.g. 0x1234…abcd. */
export function shortHash(hash: string): string {
  if (!hash || hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
