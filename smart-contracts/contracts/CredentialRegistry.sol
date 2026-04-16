// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @notice On-chain credential hash storage with issuer management for TrustLink.
 * @dev Deployed on Polygon Amoy testnet.
 */
contract CredentialRegistry {
    address public owner;

    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => Credential) public credentials;

    struct Credential {
        address issuer;
        uint256 timestamp;
        bool isRevoked;
    }

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event CredentialIssued(bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp);
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);

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

    function issueCredential(bytes32 _credentialHash) external onlyAuthorizedIssuer {
        require(credentials[_credentialHash].timestamp == 0, "Credential already exists");

        credentials[_credentialHash] = Credential({
            issuer: msg.sender,
            timestamp: block.timestamp,
            isRevoked: false
        });

        emit CredentialIssued(_credentialHash, msg.sender, block.timestamp);
    }

    function revokeCredential(bytes32 _credentialHash) external onlyAuthorizedIssuer {
        Credential storage cred = credentials[_credentialHash];
        require(cred.timestamp != 0, "Credential does not exist");
        require(cred.issuer == msg.sender, "Not credential issuer");
        require(!cred.isRevoked, "Already revoked");

        cred.isRevoked = true;
        emit CredentialRevoked(_credentialHash, msg.sender);
    }

    function verifyCredential(bytes32 _credentialHash)
        external
        view
        returns (bool exists, address issuer, uint256 timestamp, bool isRevoked)
    {
        Credential storage cred = credentials[_credentialHash];
        if (cred.timestamp == 0) {
            return (false, address(0), 0, false);
        }
        return (true, cred.issuer, cred.timestamp, cred.isRevoked);
    }

    function isIssuer(address _addr) external view returns (bool) {
        return authorizedIssuers[_addr];
    }
}
