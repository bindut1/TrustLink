// Standalone VC verifier — proves the JWT signature is valid using only the
// embedded DID, no TrustLink backend required.
//
// Usage:  node scripts/verify-vc.js "<vc_jwt>"

const { verifyCredential } = require('did-jwt-vc');

const CHAIN_ID = 80002; // Polygon Amoy

const resolver = {
  resolve: async (didUrl) => {
    const m = /^did:ethr:[^:]+:(0x[0-9a-fA-F]{40})$/.exec(didUrl);
    if (!m) {
      return {
        didDocument: null,
        didDocumentMetadata: {},
        didResolutionMetadata: { error: 'invalidDid' },
      };
    }
    const address = m[1].toLowerCase();
    const vmId = `${didUrl}#controller`;
    return {
      didDocument: {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/secp256k1recovery-2020/v2',
        ],
        id: didUrl,
        verificationMethod: [
          {
            id: vmId,
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            controller: didUrl,
            blockchainAccountId: `eip155:${CHAIN_ID}:${address}`,
          },
        ],
        authentication: [vmId],
        assertionMethod: [vmId],
      },
      didDocumentMetadata: {},
      didResolutionMetadata: { contentType: 'application/did+ld+json' },
    };
  },
};

(async () => {
  const jwt = process.argv[2];
  if (!jwt) {
    console.error('Usage: node verify-vc.js "<vc_jwt>"');
    process.exit(1);
  }
  try {
    const result = await verifyCredential(jwt, resolver);
    console.log('SIGNATURE VALID');
    console.log('Issuer DID :', result.payload.iss);
    console.log('Subject    :', result.payload.sub);
    console.log('Issued at  :', new Date(result.payload.nbf * 1000).toISOString());
    console.log('Title      :', result.verifiableCredential.credentialSubject.credential.title);
  } catch (err) {
    console.error('SIGNATURE INVALID:', err.message);
    process.exit(2);
  }
})();
