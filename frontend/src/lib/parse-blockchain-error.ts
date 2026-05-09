/**
 * Extracts a human-readable revert reason from an ethers.js error string.
 *
 * Typical raw input:
 *   execution reverted: "Credential already exists" (action="estimateGas",
 *   reason="Credential already exists", transaction={...}, code=CALL_EXCEPTION,
 *   version=6.16.0)
 *
 * Returns the cleanest part for end-user display, plus the error code if any.
 */
export type ParsedBlockchainError = {
  reason: string;
  code?: string;
};

export function parseBlockchainError(raw: string | null): ParsedBlockchainError {
  if (!raw) return { reason: "Unknown error" };

  const code = raw.match(/code=([A-Z_]+)/)?.[1];

  // Most reliable: ethers attaches reason="..."
  const reasonMatch = raw.match(/reason="([^"]+)"/);
  if (reasonMatch) return { reason: reasonMatch[1], code };

  // Fallback: quoted string after "execution reverted"
  const revertMatch = raw.match(/execution reverted:?\s*"([^"]+)"/);
  if (revertMatch) return { reason: revertMatch[1], code };

  // Fallback: text after "execution reverted" up to "("
  const revertPlain = raw.match(/execution reverted:?\s*([^(]+)/);
  if (revertPlain) return { reason: revertPlain[1].trim(), code };

  // Fallback: first segment before parenthesis if short enough
  const beforeParen = raw.split("(")[0]?.trim();
  if (beforeParen && beforeParen.length > 0 && beforeParen.length < 200) {
    return { reason: beforeParen, code };
  }

  // Last resort: truncate raw
  return {
    reason: raw.length > 140 ? `${raw.slice(0, 140)}…` : raw,
    code,
  };
}
