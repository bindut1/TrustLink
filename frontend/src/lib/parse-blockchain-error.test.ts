import { describe, expect, it } from "vitest";
import { parseBlockchainError } from "./parse-blockchain-error";

describe("parseBlockchainError", () => {
  it("returns Unknown error for null/empty input", () => {
    expect(parseBlockchainError(null)).toEqual({ reason: "Unknown error" });
    expect(parseBlockchainError("")).toEqual({ reason: "Unknown error" });
  });

  it('prefers the reason="..." attribute and extracts the code', () => {
    const raw =
      'execution reverted: "Credential already exists" (action="estimateGas", reason="Credential already exists", code=CALL_EXCEPTION, version=6.16.0)';
    expect(parseBlockchainError(raw)).toEqual({
      reason: "Credential already exists",
      code: "CALL_EXCEPTION",
    });
  });

  it("falls back to the quoted string after 'execution reverted'", () => {
    const raw = 'execution reverted: "Issuer not authorized" (version=6.16.0)';
    expect(parseBlockchainError(raw).reason).toBe("Issuer not authorized");
  });

  it("falls back to unquoted text after 'execution reverted'", () => {
    const raw = "execution reverted: Issuer not authorized (code=CALL_EXCEPTION)";
    const parsed = parseBlockchainError(raw);
    expect(parsed.reason).toBe("Issuer not authorized");
    expect(parsed.code).toBe("CALL_EXCEPTION");
  });

  it("falls back to the segment before the first parenthesis", () => {
    const raw =
      "insufficient funds for gas (transaction={...}, code=INSUFFICIENT_FUNDS)";
    expect(parseBlockchainError(raw)).toEqual({
      reason: "insufficient funds for gas",
      code: "INSUFFICIENT_FUNDS",
    });
  });

  it("truncates very long raw messages without structure", () => {
    const raw = "x".repeat(300);
    const parsed = parseBlockchainError(raw);
    expect(parsed.reason).toHaveLength(141); // 140 chars + ellipsis
    expect(parsed.reason.endsWith("…")).toBe(true);
  });

  it("returns short unstructured messages as-is", () => {
    expect(parseBlockchainError("user rejected transaction").reason).toBe(
      "user rejected transaction",
    );
  });
});
