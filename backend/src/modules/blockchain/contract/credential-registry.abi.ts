export const CREDENTIAL_REGISTRY_ABI = [
  'function owner() view returns (address)',
  'function authorizedIssuers(address) view returns (bool)',
  'function isIssuer(address) view returns (bool)',
  'function addIssuer(address _issuer)',
  'function removeIssuer(address _issuer)',
  'function issueCredential(bytes32 _credentialHash)',
  'function revokeCredential(bytes32 _credentialHash)',
  'function verifyCredential(bytes32 _credentialHash) view returns (bool exists, address issuer, uint256 timestamp, bool isRevoked)',
  'event IssuerAdded(address indexed issuer)',
  'event IssuerRemoved(address indexed issuer)',
  'event CredentialIssued(bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)',
  'event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer)',
] as const;
