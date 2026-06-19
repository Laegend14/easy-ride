import "server-only";
import { getCircleClient } from "@/lib/circle/client";
import { EASY_RIDE_ESCROW_ADDRESS } from "@/lib/contracts/easyRideEscrow";
import { rideIdToBytes32, centsToUsdcString } from "@/lib/contracts/escrow-client";

// Circle transaction states that mean the on-chain call landed / failed.
const CONFIRMED = ["CONFIRMED", "COMPLETE"];
const FAILED = ["FAILED", "DENIED", "CANCELLED"];

const POLL_INTERVAL_MS = 3000;
const POLL_ATTEMPTS = 40; // ~2 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The rider funds their own escrow: the user's Circle wallet calls the payable
 * `fundRideEscrow(bytes32)` with the fare attached as native USDC value. This is
 * a real debit from the user's Easy Ride Balance into the escrow contract.
 *
 * The native value Circle attaches for `centsToUsdcString(cents)` exactly equals
 * `centsToWei(cents)` (the amount set at createRideEscrow), satisfying the
 * contract's strict `msg.value == amount` check — verified live on Arc Testnet.
 *
 * Throws on any non-confirmation so callers can hard-fail (no fake success).
 */
export async function fundEscrowFromUser(params: {
  walletId: string;
  rideId: string;
  amountCents: number;
}): Promise<{ txHash: string }> {
  const circle = getCircleClient();

  const exec = await circle.createContractExecutionTransaction({
    walletId: params.walletId,
    contractAddress: EASY_RIDE_ESCROW_ADDRESS,
    abiFunctionSignature: "fundRideEscrow(bytes32)",
    abiParameters: [rideIdToBytes32(params.rideId)],
    amount: centsToUsdcString(params.amountCents),
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const txId = (exec.data as { id?: string })?.id;
  if (!txId) throw new Error("Escrow funding did not start (no transaction id).");

  let txHash = "";
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);
    const res = await circle.getTransaction({ id: txId });
    const tx = (res.data as { transaction?: { state?: string; txHash?: string } })?.transaction;
    const state = tx?.state ?? "";
    if (tx?.txHash) txHash = tx.txHash;

    if (CONFIRMED.includes(state)) {
      if (!txHash) throw new Error("Escrow funding confirmed without a transaction hash.");
      return { txHash };
    }
    if (FAILED.includes(state)) {
      throw new Error(`Escrow funding ${state.toLowerCase()}.`);
    }
  }
  throw new Error("Escrow funding timed out awaiting on-chain confirmation.");
}
