import "server-only";
import {
  getEscrowContract,
  getOperatorAddress,
  rideIdToBytes32,
  centsToWei,
} from "@/lib/contracts/escrow-client";

/**
 * Operator-side escrow actions backed by the deployed EasyRideEscrow contract on
 * Arc Testnet. These are the calls the platform (contract owner/operator) signs:
 * opening the escrow, completing the ride, releasing to the driver, refunding
 * the rider, and reassigning on recovery. The rider-funding leg is NOT here — the
 * rider's own Easy Ride Balance debits the escrow via Circle (see
 * `@/lib/payments/escrow-funding`). The escrow key is the DB booking id mapped to
 * bytes32. All amounts are true-dollar native USDC (18 dp).
 */
export class OnchainEconomicActions {
  /**
   * Open an escrow for a ride. The rider is the user's own wallet (it will be
   * debited at funding); the provider/driver is the operator. Operator-signed.
   */
  async createEscrow(
    rideId: string,
    amountCents: number,
    riderAddress: string,
  ): Promise<{ txHash: string }> {
    const contract = getEscrowContract();
    const driver = await getOperatorAddress();
    const tx = await contract.createRideEscrow(
      rideIdToBytes32(rideId),
      riderAddress,
      driver,
      centsToWei(amountCents),
    );
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  }

  /** Mark a funded ride complete (Funded -> Completed) before release. */
  async completeRide(rideId: string): Promise<{ txHash: string }> {
    const contract = getEscrowContract();
    const tx = await contract.completeRide(rideIdToBytes32(rideId));
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  }

  /** Release escrowed funds to the driver (operator). Operator-signed. */
  async releasePayment(rideId: string): Promise<{ txHash: string }> {
    const contract = getEscrowContract();
    const tx = await contract.releaseRidePayment(rideIdToBytes32(rideId));
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  }

  /** Refund escrowed funds back to the rider's wallet. Operator-signed. */
  async issueRefund(rideId: string): Promise<{ txHash: string }> {
    const contract = getEscrowContract();
    const tx = await contract.refundRidePayment(rideIdToBytes32(rideId));
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  }

  /** Move a funded escrow to a replacement driver in place. Operator-signed. */
  async reassignEscrow(rideId: string, newProvider: string): Promise<{ txHash: string }> {
    const contract = getEscrowContract();
    const tx = await contract.reassignRide(rideIdToBytes32(rideId), newProvider);
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  }
}
