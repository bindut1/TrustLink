import { keccak256, toUtf8Bytes } from 'ethers';
import { buildMerkleTree, getProof, verifyProof } from './merkle';

const leaf = (s: string) => keccak256(toUtf8Bytes(s));

describe('merkle', () => {
  it('verifies a proof for every leaf (odd count, exercises carry-up)', () => {
    const leaves = ['a', 'b', 'c', 'd', 'e'].map(leaf);
    const tree = buildMerkleTree(leaves);
    leaves.forEach((l, i) => {
      expect(verifyProof(l, getProof(tree, i), tree.root)).toBe(true);
    });
  });

  it('handles a batch of one (root == leaf, empty proof)', () => {
    const only = leaf('solo');
    const tree = buildMerkleTree([only]);
    expect(tree.root).toBe(only);
    expect(verifyProof(only, getProof(tree, 0), tree.root)).toBe(true);
  });

  it('rejects a tampered leaf', () => {
    const leaves = ['a', 'b', 'c', 'd'].map(leaf);
    const tree = buildMerkleTree(leaves);
    const proof = getProof(tree, 1);
    expect(verifyProof(leaf('TAMPERED'), proof, tree.root)).toBe(false);
  });

  it('rejects a proof against a different root', () => {
    const t1 = buildMerkleTree(['a', 'b', 'c'].map(leaf));
    const t2 = buildMerkleTree(['x', 'y', 'z'].map(leaf));
    expect(verifyProof(leaf('a'), getProof(t1, 0), t2.root)).toBe(false);
  });
});
