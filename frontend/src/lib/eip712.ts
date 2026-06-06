/**
 * Client mirror of the backend EIP-712 definition
 * (backend/src/modules/blockchain/eip712.ts). MUST stay byte-for-byte identical
 * (domain name/version, type fields + order) or signatures won't verify.
 */

export const CREDENTIAL_EIP712_TYPES = {
  Credential: [
    { name: "credentialId", type: "string" },
    { name: "credentialNumber", type: "string" },
    { name: "title", type: "string" },
    { name: "issuerDid", type: "string" },
    { name: "subjectId", type: "string" },
    { name: "credentialHash", type: "bytes32" },
    { name: "issuedDate", type: "string" },
  ],
} as const;

export interface CredentialEip712Message {
  credentialId: string;
  credentialNumber: string;
  title: string;
  issuerDid: string;
  subjectId: string;
  credentialHash: string;
  issuedDate: string;
}

export interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
}

export interface CredentialTypedData {
  domain: Eip712Domain;
  types: typeof CREDENTIAL_EIP712_TYPES;
  primaryType: "Credential";
  message: CredentialEip712Message;
}

// Batch signing: issuer signs the Merkle root ONCE for the whole batch.
export const BATCH_EIP712_TYPES = {
  Batch: [
    { name: "merkleRoot", type: "bytes32" },
    { name: "issuerDid", type: "string" },
    { name: "count", type: "uint256" },
    { name: "issuedAt", type: "string" },
  ],
} as const;

export interface BatchEip712Message {
  merkleRoot: string;
  issuerDid: string;
  count: number;
  issuedAt: string;
}

export interface BatchTypedData {
  domain: Eip712Domain;
  types: typeof BATCH_EIP712_TYPES;
  primaryType: "Batch";
  message: BatchEip712Message;
}
