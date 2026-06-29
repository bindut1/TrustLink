// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CredentialRegistry {
    address public owner;

    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => Batch) public batches;

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

    function revokeLeaf(bytes32 _leafHash) external onlyAuthorizedIssuer {
        require(!revokedLeaves[_leafHash], "Leaf already revoked");
        revokedLeaves[_leafHash] = true;
        emit LeafRevoked(_leafHash, msg.sender);
    }

    function isLeafRevoked(bytes32 _leafHash) external view returns (bool) {
        return revokedLeaves[_leafHash];
    }
}
