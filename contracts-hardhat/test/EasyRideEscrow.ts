import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const rideId = ethers.id("ride-1");
const AMOUNT = ethers.parseEther("20");

async function deploy() {
  const [owner, rider, provider, provider2] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("EasyRideEscrow");
  const escrow = await Factory.deploy();
  await escrow.waitForDeployment();
  return { escrow, owner, rider, provider, provider2 };
}

describe("EasyRideEscrow", () => {
  it("deploys with the deployer as owner", async () => {
    const { escrow, owner } = await loadFixture(deploy);
    expect(await escrow.owner()).to.equal(owner.address);
  });

  it("create -> fund -> complete -> release pays the provider", async () => {
    const { escrow, rider, provider } = await loadFixture(deploy);
    await escrow.createRideEscrow(rideId, rider.address, provider.address, AMOUNT);
    await expect(escrow.connect(rider).fundRideEscrow(rideId, { value: AMOUNT })).to.emit(
      escrow,
      "RideEscrowFunded",
    );
    await escrow.completeRide(rideId);
    await expect(escrow.releaseRidePayment(rideId)).to.changeEtherBalance(provider, AMOUNT);
    expect((await escrow.getRideEscrow(rideId)).status).to.equal(3); // Released
  });

  it("create -> fund -> refund returns the rider", async () => {
    const { escrow, rider, provider } = await loadFixture(deploy);
    await escrow.createRideEscrow(rideId, rider.address, provider.address, AMOUNT);
    await escrow.connect(rider).fundRideEscrow(rideId, { value: AMOUNT });
    await expect(escrow.refundRidePayment(rideId)).to.changeEtherBalance(rider, AMOUNT);
  });

  it("cancel before funding just cancels; after funding auto-refunds", async () => {
    const { escrow, rider, provider } = await loadFixture(deploy);
    await escrow.createRideEscrow(rideId, rider.address, provider.address, AMOUNT);
    await expect(escrow.cancelRide(rideId)).to.emit(escrow, "RideCancelled").withArgs(rideId, false);

    const r2 = ethers.id("ride-2");
    await escrow.createRideEscrow(r2, rider.address, provider.address, AMOUNT);
    await escrow.connect(rider).fundRideEscrow(r2, { value: AMOUNT });
    await expect(escrow.cancelRide(r2)).to.changeEtherBalance(rider, AMOUNT);
    expect((await escrow.getRideEscrow(r2)).status).to.equal(5); // Cancelled
  });

  it("reassign keeps funds locked and swaps the provider", async () => {
    const { escrow, rider, provider, provider2 } = await loadFixture(deploy);
    await escrow.createRideEscrow(rideId, rider.address, provider.address, AMOUNT);
    await escrow.connect(rider).fundRideEscrow(rideId, { value: AMOUNT });
    await expect(escrow.reassignRide(rideId, provider2.address))
      .to.emit(escrow, "RideReassigned")
      .withArgs(rideId, provider.address, provider2.address);

    const e = await escrow.getRideEscrow(rideId);
    expect(e.provider).to.equal(provider2.address);
    expect(e.status).to.equal(2); // Funded (funds preserved)
    // New provider gets paid on release.
    await expect(escrow.releaseRidePayment(rideId)).to.changeEtherBalance(provider2, AMOUNT);
  });

  it("reverts on wrong amount, wrong status, non-owner, and double create", async () => {
    const { escrow, rider, provider } = await loadFixture(deploy);
    await escrow.createRideEscrow(rideId, rider.address, provider.address, AMOUNT);

    await expect(
      escrow.connect(rider).fundRideEscrow(rideId, { value: ethers.parseEther("1") }),
    ).to.be.revertedWithCustomError(escrow, "WrongValue");

    await expect(
      escrow.createRideEscrow(rideId, rider.address, provider.address, AMOUNT),
    ).to.be.revertedWithCustomError(escrow, "AlreadyExists");

    await expect(
      escrow.connect(rider).createRideEscrow(ethers.id("x"), rider.address, provider.address, AMOUNT),
    ).to.be.revertedWithCustomError(escrow, "NotOwner");

    // release before funding -> invalid status
    await expect(escrow.releaseRidePayment(rideId)).to.be.revertedWithCustomError(
      escrow,
      "InvalidStatus",
    );
  });

  it("prevents double funding", async () => {
    const { escrow, rider, provider } = await loadFixture(deploy);
    await escrow.createRideEscrow(rideId, rider.address, provider.address, AMOUNT);
    await escrow.connect(rider).fundRideEscrow(rideId, { value: AMOUNT });
    await expect(
      escrow.connect(rider).fundRideEscrow(rideId, { value: AMOUNT }),
    ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
  });
});
