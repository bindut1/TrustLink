// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CredentialRegistry
 * @notice Stores credential hashes on-chain and manages authorized issuers.
 */
contract CredentialRegistry {
    address public admin;

    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => Credential) public credentials;

    struct Credential {
        bytes32 credentialHash;
        address issuer;
        uint256 issuedAt;
        bool revoked;
    }

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, bytes32 credentialHash);
    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addIssuer(address _issuer) external onlyAdmin {
        authorizedIssuers[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    function removeIssuer(address _issuer) external onlyAdmin {
        authorizedIssuers[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    function issueCredential(
        bytes32 _credentialId,
        bytes32 _credentialHash
    ) external onlyAuthorizedIssuer {
        require(credentials[_credentialId].issuedAt == 0, "Credential already exists");

        credentials[_credentialId] = Credential({
            credentialHash: _credentialHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit CredentialIssued(_credentialId, msg.sender, _credentialHash);
    }

    function revokeCredential(bytes32 _credentialId) external onlyAuthorizedIssuer {
        Credential storage cred = credentials[_credentialId];
        require(cred.issuedAt != 0, "Credential does not exist");
        require(cred.issuer == msg.sender, "Not credential issuer");
        require(!cred.revoked, "Already revoked");

        cred.revoked = true;
        emit CredentialRevoked(_credentialId, msg.sender);
    }

    function verifyCredential(
        bytes32 _credentialId,
        bytes32 _credentialHash
    ) external view returns (bool valid, bool revoked) {
        Credential storage cred = credentials[_credentialId];
        if (cred.issuedAt == 0) return (false, false);
        valid = (cred.credentialHash == _credentialHash);
        revoked = cred.revoked;
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }
}
