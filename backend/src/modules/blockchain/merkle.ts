import { concat, keccak256 } from 'ethers';

/**
 * Minimal Merkle tree for credential batching (Blockcerts-style).
 *
 * - Leaves are bytes32 hex strings (each = a credential's canonical hash).
 * - Pairs are hashed with a commutative (sorted) keccak256 so proof order is
 *   irrelevant — matching OpenZeppelin's MerkleProof convention.
 * - Odd nodes are carried up unchanged.
 *
 * Only the root is anchored on-chain; proof verification happens off-chain in
 * the verifier. Builder and verifier here use the same scheme so they agree.
 */

function hashPair(a: string, b: string): string {
  const [x, y] = a.toLowerCase() <= b.toLowerCase() ? [a, b] : [b, a];
  return keccak256(concat([x, y]));
}

export interface MerkleTree {
  root: string;
  layers: string[][];
}

export function buildMerkleTree(leaves: string[]): MerkleTree {
  if (leaves.length === 0) {
    throw new Error('Cannot build a Merkle tree from zero leaves');
  }
  const layers: string[][] = [leaves.slice()];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next: string[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(i + 1 < prev.length ? hashPair(prev[i], prev[i + 1]) : prev[i]);
    }
    layers.push(next);
  }
  return { root: layers[layers.length - 1][0], layers };
}

/** Sibling hashes from the leaf up to (but excluding) the root. */
export function getProof(tree: MerkleTree, leafIndex: number): string[] {
  const proof: string[] = [];
  let idx = leafIndex;
  for (let level = 0; level < tree.layers.length - 1; level++) {
    const layer = tree.layers[level];
    const pairIndex = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (pairIndex < layer.length) proof.push(layer[pairIndex]);
    idx = Math.floor(idx / 2);
  }
  return proof;
}

export function verifyProof(
  leaf: string,
  proof: string[],
  root: string,
): boolean {
  let computed = leaf;
  for (const sibling of proof) computed = hashPair(computed, sibling);
  return computed.toLowerCase() === root.toLowerCase();
}
