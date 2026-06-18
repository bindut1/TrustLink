/**
 * The on-chain transaction hash that matches a credential's CURRENT status:
 * once revoked, the issuer-signed `revokeLeaf` tx (Option B); otherwise the
 * issuance anchor (`issueBatch`). The issuance anchor is never overwritten, so
 * we pick by status at display time.
 */
export function statusTxHash(c: {
  status?: string | null;
  blockchainTxHash?: string | null;
  revokeTxHash?: string | null;
}): { hash: string | null; isRevoke: boolean } {
  if (c.status === "revoked" && c.revokeTxHash) {
    return { hash: c.revokeTxHash, isRevoke: true };
  }
  return { hash: c.blockchainTxHash ?? null, isRevoke: false };
}
