import { expect } from "chai";
import { ethers } from "hardhat";
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import type { CredentialRegistry } from "../typechain-types";

describe("CredentialRegistry", () => {
  async function deploy() {
    const [owner, issuer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CredentialRegistry");
    const registry = (await Factory.deploy()) as unknown as CredentialRegistry;
    await registry.waitForDeployment();
    return { registry, owner, issuer, other };
  }

  const root = ethers.keccak256(ethers.toUtf8Bytes("batch-merkle-root"));

  describe("issuer management", () => {
    it("owner can authorize an issuer", async () => {
      const { registry, issuer } = await deploy();
      await registry.addIssuer(issuer.address);
      expect(await registry.isIssuer(issuer.address)).to.equal(true);
    });

    it("non-owner cannot authorize", async () => {
      const { registry, issuer, other } = await deploy();
      await expect(
        registry.connect(other).addIssuer(issuer.address),
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("issueBatch", () => {
    it("authorized issuer can anchor a batch; msg.sender is recorded as issuer", async () => {
      const { registry, issuer } = await deploy();
      await registry.addIssuer(issuer.address);

      await expect(registry.connect(issuer).issueBatch(root))
        .to.emit(registry, "BatchIssued")
        .withArgs(root, issuer.address, anyUint);

      const [exists, recordedIssuer, , isRevoked] =
        await registry.verifyBatch(root);
      expect(exists).to.equal(true);
      expect(recordedIssuer).to.equal(issuer.address); // not the deployer/owner
      expect(isRevoked).to.equal(false);
    });

    it("unauthorized address cannot anchor a batch", async () => {
      const { registry, other } = await deploy();
      await expect(
        registry.connect(other).issueBatch(root),
      ).to.be.revertedWith("Not authorized issuer");
    });

    it("the same root cannot be anchored twice", async () => {
      const { registry, issuer } = await deploy();
      await registry.addIssuer(issuer.address);
      await registry.connect(issuer).issueBatch(root);
      await expect(
        registry.connect(issuer).issueBatch(root),
      ).to.be.revertedWith("Batch already exists");
    });
  });

  describe("revokeBatch", () => {
    it("only the issuing institution can revoke its batch", async () => {
      const { registry, issuer, other } = await deploy();
      await registry.addIssuer(issuer.address);
      await registry.addIssuer(other.address);
      await registry.connect(issuer).issueBatch(root);

      await expect(
        registry.connect(other).revokeBatch(root),
      ).to.be.revertedWith("Not batch issuer");

      await expect(registry.connect(issuer).revokeBatch(root))
        .to.emit(registry, "BatchRevoked")
        .withArgs(root, issuer.address);

      const [, , , isRevoked] = await registry.verifyBatch(root);
      expect(isRevoked).to.equal(true);
    });

    it("cannot revoke a non-existent or already-revoked batch", async () => {
      const { registry, issuer } = await deploy();
      await registry.addIssuer(issuer.address);
      await expect(
        registry.connect(issuer).revokeBatch(root),
      ).to.be.revertedWith("Batch does not exist");

      await registry.connect(issuer).issueBatch(root);
      await registry.connect(issuer).revokeBatch(root);
      await expect(
        registry.connect(issuer).revokeBatch(root),
      ).to.be.revertedWith("Already revoked");
    });
  });

  describe("verifyBatch", () => {
    it("returns not-found for an unknown root", async () => {
      const { registry } = await deploy();
      const [exists] = await registry.verifyBatch(
        ethers.keccak256(ethers.toUtf8Bytes("unknown")),
      );
      expect(exists).to.equal(false);
    });
  });

  describe("revokeLeaf", () => {
    const leaf = ethers.keccak256(ethers.toUtf8Bytes("credential-leaf-hash"));

    it("authorized issuer can revoke a single leaf; root stays intact", async () => {
      const { registry, issuer } = await deploy();
      await registry.addIssuer(issuer.address);
      await registry.connect(issuer).issueBatch(root);

      expect(await registry.isLeafRevoked(leaf)).to.equal(false);

      await expect(registry.connect(issuer).revokeLeaf(leaf))
        .to.emit(registry, "LeafRevoked")
        .withArgs(leaf, issuer.address);

      expect(await registry.isLeafRevoked(leaf)).to.equal(true);

      // The batch (and thus every other leaf) is untouched by a leaf revocation.
      const [exists, , , batchRevoked] = await registry.verifyBatch(root);
      expect(exists).to.equal(true);
      expect(batchRevoked).to.equal(false);
    });

    it("does not require the leaf to belong to any anchored batch", async () => {
      const { registry, issuer } = await deploy();
      await registry.addIssuer(issuer.address);
      // No issueBatch at all — revocation is independent of issuance.
      await registry.connect(issuer).revokeLeaf(leaf);
      expect(await registry.isLeafRevoked(leaf)).to.equal(true);
    });

    it("unauthorized address cannot revoke a leaf", async () => {
      const { registry, other } = await deploy();
      await expect(
        registry.connect(other).revokeLeaf(leaf),
      ).to.be.revertedWith("Not authorized issuer");
    });

    it("cannot revoke the same leaf twice", async () => {
      const { registry, issuer } = await deploy();
      await registry.addIssuer(issuer.address);
      await registry.connect(issuer).revokeLeaf(leaf);
      await expect(
        registry.connect(issuer).revokeLeaf(leaf),
      ).to.be.revertedWith("Leaf already revoked");
    });

    it("isLeafRevoked is false for an unknown leaf", async () => {
      const { registry } = await deploy();
      expect(
        await registry.isLeafRevoked(
          ethers.keccak256(ethers.toUtf8Bytes("never-revoked")),
        ),
      ).to.equal(false);
    });
  });
});
