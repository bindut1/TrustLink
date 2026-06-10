/**
 * Guards the client/server EIP-712 contract: the frontend mirror MUST be
 * byte-for-byte identical to backend/src/modules/blockchain/eip712.ts (field
 * names, types AND order — all are part of the EIP-712 type hash), otherwise
 * MetaMask signatures will never verify on the backend.
 */
import { describe, expect, it } from "vitest";
import {
  BATCH_EIP712_TYPES as BACKEND_BATCH_TYPES,
  CREDENTIAL_EIP712_TYPES as BACKEND_CREDENTIAL_TYPES,
} from "../../../backend/src/modules/blockchain/eip712";
import {
  BATCH_EIP712_TYPES as FRONTEND_BATCH_TYPES,
  CREDENTIAL_EIP712_TYPES as FRONTEND_CREDENTIAL_TYPES,
} from "./eip712";

describe("EIP-712 frontend/backend parity", () => {
  it("Credential type definition matches the backend exactly", () => {
    expect(FRONTEND_CREDENTIAL_TYPES).toEqual(BACKEND_CREDENTIAL_TYPES);
  });

  it("Batch type definition matches the backend exactly", () => {
    expect(FRONTEND_BATCH_TYPES).toEqual(BACKEND_BATCH_TYPES);
  });

  it("preserves field order (it is part of the type hash)", () => {
    expect(FRONTEND_CREDENTIAL_TYPES.Credential.map((f) => f.name)).toEqual(
      BACKEND_CREDENTIAL_TYPES.Credential.map((f) => f.name),
    );
    expect(FRONTEND_BATCH_TYPES.Batch.map((f) => f.name)).toEqual(
      BACKEND_BATCH_TYPES.Batch.map((f) => f.name),
    );
  });
});
