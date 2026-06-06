/**
 * EIP-712 typed-data definition for credential signing
 * (W3C `EthereumEip712Signature2021` proof type).
 *
 * The issuer signs this structure with MetaMask (`eth_signTypedData_v4`); the
 * backend verifies it with `ethers.verifyTypedData`. The frontend MUST use an
 * identical domain + types, so keep this module the single source of truth and
 * mirror it on the client.
 */

export const EIP712_PROOF_TYPE = 'EthereumEip712Signature2021';

/** Field order matters — it is part of the EIP-712 type hash. */
export const CREDENTIAL_EIP712_TYPES = {
  Credential: [
    { name: 'credentialId', type: 'string' },
    { name: 'credentialNumber', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'issuerDid', type: 'string' },
    { name: 'subjectId', type: 'string' },
    { name: 'credentialHash', type: 'bytes32' },
    { name: 'issuedDate', type: 'string' },
  ],
} as const;

export const CREDENTIAL_EIP712_PRIMARY_TYPE = 'Credential';

export interface CredentialEip712Message {
  credentialId: string;
  credentialNumber: string;
  title: string;
  issuerDid: string;
  subjectId: string;
  /** bytes32 — the canonical content hash also used as the Merkle leaf. */
  credentialHash: string;
  issuedDate: string;
}

export interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
}

export function buildCredentialDomain(chainId: number): Eip712Domain {
  return { name: 'TrustLinkCredential', version: '1', chainId };
}

/** The full typed-data bundle handed to the wallet for signing. */
export interface CredentialTypedData {
  domain: Eip712Domain;
  types: typeof CREDENTIAL_EIP712_TYPES;
  primaryType: typeof CREDENTIAL_EIP712_PRIMARY_TYPE;
  message: CredentialEip712Message;
}

// ─────────────────── Batch signing (1 signature for N credentials) ───────────────────
// For bulk issuance the issuer signs the Merkle ROOT once instead of each VC.
// Each credential's membership is then proven by its Merkle proof; the single
// batch signature is shared across the whole batch.

export const BATCH_EIP712_TYPES = {
  Batch: [
    { name: 'merkleRoot', type: 'bytes32' },
    { name: 'issuerDid', type: 'string' },
    { name: 'count', type: 'uint256' },
    { name: 'issuedAt', type: 'string' },
  ],
} as const;

export const BATCH_EIP712_PRIMARY_TYPE = 'Batch';

export interface BatchEip712Message {
  merkleRoot: string;
  issuerDid: string;
  count: number;
  issuedAt: string;
}

export interface BatchTypedData {
  domain: Eip712Domain;
  types: typeof BATCH_EIP712_TYPES;
  primaryType: typeof BATCH_EIP712_PRIMARY_TYPE;
  message: BatchEip712Message;
}
