// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @notice On-chain credential anchoring with issuer management for TrustLink.
 * @dev Deployed on Polygon Amoy testnet.
 *
 * Blockcerts-style batch anchoring: one Merkle root represents many
 * credentials, anchored in a single `issueBatch` tx by the issuing institution.
 * Revocation works at two granularities, both signed by the issuer:
 *   - `revokeBatch`  — invalidates a whole Merkle root (every credential in it).
 *   - `revokeLeaf`   — invalidates a single credential by its leaf hash, without
 *                      touching the root or the other leaves. Membership in the
 *                      root is proven off-chain via a Merkle proof; this set only
 *                      records "this leaf is no longer valid".
 */
contract CredentialRegistry {
    address public owner;

    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => Batch) public batches;

    // Per-credential revocation set, keyed by the credential's Merkle leaf hash.
    // Independent of issuance: a leaf can be revoked even though only the batch
    // root was ever stored on-chain.
    mapping(bytes32 => bool) public revokedLeaves;

    struct Batch {
        address issuer;
        uint256 timestamp;
        bool isRevoked;
    }

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event BatchIssued(bytes32 indexed merkleRoot, address indexed issuer, uint256 timestamp);
    event BatchRevoked(bytes32 indexed merkleRoot, address indexed issuer);
    event LeafRevoked(bytes32 indexed leafHash, address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Invalid address");
        require(!authorizedIssuers[_issuer], "Already an issuer");
        authorizedIssuers[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    function removeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer], "Not an issuer");
        authorizedIssuers[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    function isIssuer(address _addr) external view returns (bool) {
        return authorizedIssuers[_addr];
    }

    // ───────────────────────── Batch (Merkle) anchoring ─────────────────────────

    /**
     * @notice Anchor a Merkle root representing a batch of credentials.
     * @dev msg.sender (the issuing institution) is recorded as the batch issuer,
     *      so on-chain attribution reflects the real issuer — not a relayer.
     */
    function issueBatch(bytes32 _merkleRoot) external onlyAuthorizedIssuer {
        require(batches[_merkleRoot].timestamp == 0, "Batch already exists");

        batches[_merkleRoot] = Batch({
            issuer: msg.sender,
            timestamp: block.timestamp,
            isRevoked: false
        });

        emit BatchIssued(_merkleRoot, msg.sender, block.timestamp);
    }

    function revokeBatch(bytes32 _merkleRoot) external onlyAuthorizedIssuer {
        Batch storage b = batches[_merkleRoot];
        require(b.timestamp != 0, "Batch does not exist");
        require(b.issuer == msg.sender, "Not batch issuer");
        require(!b.isRevoked, "Already revoked");

        b.isRevoked = true;
        emit BatchRevoked(_merkleRoot, msg.sender);
    }

    function verifyBatch(bytes32 _merkleRoot)
        external
        view
        returns (bool exists, address issuer, uint256 timestamp, bool isRevoked)
    {
        Batch storage b = batches[_merkleRoot];
        if (b.timestamp == 0) {
            return (false, address(0), 0, false);
        }
        return (true, b.issuer, b.timestamp, b.isRevoked);
    }

    // ───────────────────────── Per-leaf revocation ─────────────────────────

    /**
     * @notice Revoke a single credential by its Merkle leaf hash.
     * @dev Does NOT require the leaf to have been issued on-chain — only the
     *      batch root is stored. Anchoring stays one cheap tx per batch; this
     *      adds one tx only when a specific credential is revoked. Whether the
     *      leaf genuinely belongs to an anchored root is checked off-chain by the
     *      verifier via a Merkle proof, so revoking an unknown hash is harmless.
     */
    function revokeLeaf(bytes32 _leafHash) external onlyAuthorizedIssuer {
        require(!revokedLeaves[_leafHash], "Leaf already revoked");
        revokedLeaves[_leafHash] = true;
        emit LeafRevoked(_leafHash, msg.sender);
    }

    function isLeafRevoked(bytes32 _leafHash) external view returns (bool) {
        return revokedLeaves[_leafHash];
    }
}
