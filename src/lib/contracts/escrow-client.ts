import "server-only";
import { ethers } from "ethers";
import { serverEnv } from "@/lib/env";
import { getCircleClient } from "@/lib/circle/client";
import {
  EASY_RIDE_ESCROW_ABI,
  EASY_RIDE_ESCROW_ADDRESS,
  EASY_RIDE_ESCROW_CHAIN_ID,
} from "./easyRideEscrow";

/**
 * Wallet that receives payment on ride completion. In this build the platform
 * operator (the escrow contract deployer) also serves as the driver/payee, so
 * completed rides release funds here. Funds are debited from the rider's own
 * Easy Ride Balance, held in the contract, then released here.
 */
export const SETTLEMENT_ADDRESS = "0x1014f15b3E2fe78F21eea1660eEAD54B1d6616a7";

/** Thrown when the operator key / RPC isn't configured, so callers can fall back. */
export class EscrowUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EscrowUnavailableError";
  }
}

let provider: ethers.JsonRpcProvider | null = null;
let operator: ethers.Wallet | null = null;

export function isEscrowConfigured(): boolean {
  return Boolean(serverEnv.arcDeployerKey && EASY_RIDE_ESCROW_ADDRESS);
}

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(serverEnv.arcRpcUrl, EASY_RIDE_ESCROW_CHAIN_ID);
  }
  return provider;
}

function getOperator(): ethers.Wallet {
  if (!operator) {
    const key = serverEnv.arcDeployerKey;
    if (!key) throw new EscrowUnavailableError("ARC_DEPLOYER_PRIVATE_KEY is not set");
    operator = new ethers.Wallet(key, getProvider());
  }
  return operator;
}

export function getEscrowContract(): ethers.Contract {
  if (!EASY_RIDE_ESCROW_ADDRESS) {
    throw new EscrowUnavailableError("Escrow contract address is not set");
  }
  return new ethers.Contract(
    EASY_RIDE_ESCROW_ADDRESS,
    EASY_RIDE_ESCROW_ABI as ethers.InterfaceAbi,
    getOperator(),
  );
}

/** The operator wallet address — platform operator and driver/payee. */
export async function getOperatorAddress(): Promise<string> {
  return getOperator().getAddress();
}

/** Stable bytes32 ride id from our DB uuid. */
export function rideIdToBytes32(rideId: string): string {
  return ethers.id(rideId);
}

/**
 * True-dollar mapping: fare cents -> Arc native USDC value in wei (18 decimals).
 * 100 cents = 1 USDC = 1e18 wei. This is the amount locked at createRideEscrow
 * and MUST exactly equal the value the rider attaches at fundRideEscrow, so it
 * is derived to match `centsToUsdcString` (Circle parses that string the same
 * way: parseEther(toFixed(2)) === cents * 1e16). Verified live on Arc Testnet.
 */
export function centsToWei(cents: number): bigint {
  // 1 cent = 1e16 wei (since 100 cents = 1 USDC = 1e18 wei). String literal keeps
  // it exact and avoids BigInt-literal syntax (tsconfig target < ES2020).
  return BigInt(Math.max(0, Math.round(cents))) * BigInt("10000000000000000");
}

/**
 * The same fare as a decimal USDC string (e.g. 2000 -> "20.00") for Circle's
 * contract-execution `amount` — the native value the rider sends to the escrow.
 */
export function centsToUsdcString(cents: number): string {
  return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
}
