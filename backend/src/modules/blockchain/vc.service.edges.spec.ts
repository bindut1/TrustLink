// did-jwt / did-jwt-vc ship ESM that the CommonJS jest runtime can't parse.
jest.mock('did-jwt', () => ({ ES256KSigner: jest.fn(), hexToBytes: jest.fn() }));
jest.mock('did-jwt-vc', () => ({
  createVerifiableCredentialJwt: jest.fn(),
  verifyCredential: jest.fn(),
}));

import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { VcService } from './vc.service';

const config = {
  get: (key: string, def?: string) =>
    key === 'POLYGON_CHAIN_ID' ? '80002' : def,
} as unknown as ConfigService;

const ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

describe('VcService — DID helpers and guard rails', () => {
  const service = new VcService(config);
  const candidate = { id: 'user-1', fullName: 'Nguyen Van A' } as User;
  const credential = {
    id: 'cred-1',
    credentialNumber: 'DUT-1',
    title: 'BSc',
    credentialHash: '0x' + '11'.repeat(32),
    issuedDate: new Date('2026-01-15'),
  } as unknown as Credential;

  it('builds a lowercase did:ethr DID from an address', () => {
    expect(service.buildIssuerDid(ADDRESS)).toBe(
      `did:ethr:polygon:${ADDRESS.toLowerCase()}`,
    );
  });

  it('parses the address back out of a DID, lowercased', () => {
    expect(service.parseAddressFromDid(`did:ethr:polygon:${ADDRESS}`)).toBe(
      ADDRESS.toLowerCase(),
    );
  });

  it.each([
    ['missing network', 'did:ethr:0xabc'],
    ['not a did', 'urn:something:else'],
    ['bad address length', 'did:ethr:polygon:0x1234'],
    ['non-hex address', 'did:ethr:polygon:0x' + 'zz'.repeat(20)],
  ])('returns null for an invalid DID (%s)', (_label, did) => {
    expect(service.parseAddressFromDid(did)).toBeNull();
  });

  it('falls back to blockchainAddress when signingAddress is absent', () => {
    const institution = {
      id: 'inst-1',
      signingAddress: null,
      blockchainAddress: ADDRESS,
    } as unknown as Institution;
    const td = service.buildCredentialTypedData({
      credential,
      institution,
      candidate,
    });
    expect(td.message.issuerDid).toBe(
      `did:ethr:polygon:${ADDRESS.toLowerCase()}`,
    );
  });

  it('rejects building typed data without a valid signing address', () => {
    const institution = {
      id: 'inst-1',
      signingAddress: 'not-an-address',
      blockchainAddress: null,
    } as unknown as Institution;
    expect(() =>
      service.buildCredentialTypedData({ credential, institution, candidate }),
    ).toThrow(InternalServerErrorException);
  });

  it('rejects building typed data for a credential with no hash', () => {
    const institution = {
      id: 'inst-1',
      signingAddress: ADDRESS,
      blockchainAddress: null,
    } as unknown as Institution;
    const noHash = { ...credential, credentialHash: null } as never;
    expect(() =>
      service.buildCredentialTypedData({
        credential: noHash,
        institution,
        candidate,
      }),
    ).toThrow(InternalServerErrorException);
  });

  it('normalizes issuedDate (Date or string) to YYYY-MM-DD in the message', () => {
    const institution = {
      id: 'inst-1',
      signingAddress: ADDRESS,
      blockchainAddress: null,
    } as unknown as Institution;
    const td = service.buildCredentialTypedData({
      credential,
      institution,
      candidate,
    });
    expect(td.message.issuedDate).toBe('2026-01-15');

    const fromString = service.buildCredentialTypedData({
      credential: { ...credential, issuedDate: '2025-12-31' } as never,
      institution,
      candidate,
    });
    expect(fromString.message.issuedDate).toBe('2025-12-31');
  });

  it('rejects building batch typed data without a valid signing address', () => {
    const institution = {
      id: 'inst-1',
      signingAddress: null,
      blockchainAddress: null,
    } as unknown as Institution;
    expect(() =>
      service.buildBatchTypedData({
        merkleRoot: '0x' + 'ab'.repeat(32),
        institution,
        count: 2,
        issuedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow(InternalServerErrorException);
  });
});

describe('VcService — verify on malformed input (never throws)', () => {
  const service = new VcService(config);

  it.each([
    ['null payload', null],
    ['empty object', {}],
    ['proof of a different type', { proof: { type: 'Ed25519Signature2020' } }],
    [
      'eip712 proof missing payload',
      { proof: { type: 'EthereumEip712Signature2021' } },
    ],
    [
      'eip712 proof missing signature',
      {
        proof: {
          type: 'EthereumEip712Signature2021',
          eip712: { domain: {}, types: { Credential: [] }, message: {} },
        },
      },
    ],
  ])('verifyEip712 returns invalid for %s', (_label, vcJson) => {
    const result = service.verifyEip712(vcJson as never);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('verifyEip712 returns invalid (not throws) on garbage signature', () => {
    const result = service.verifyEip712({
      proof: {
        type: 'EthereumEip712Signature2021',
        proofValue: '0xdeadbeef',
        verificationMethod: `did:ethr:polygon:${ADDRESS.toLowerCase()}`,
        eip712: {
          domain: { name: 'TrustLinkCredential', version: '1', chainId: 80002 },
          types: { Credential: [{ name: 'title', type: 'string' }] },
          message: { title: 'x' },
        },
      },
    } as never);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('verifyBatchEip712 returns invalid for a non-batch proof', () => {
    const result = service.verifyBatchEip712({
      proof: {
        type: 'EthereumEip712Signature2021',
        proofValue: '0x00',
        eip712: { primaryType: 'Credential' },
      },
    } as never);
    expect(result.valid).toBe(false);
  });
});
