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
