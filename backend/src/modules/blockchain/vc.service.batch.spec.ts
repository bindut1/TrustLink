// did-jwt / did-jwt-vc ship ESM that the CommonJS jest runtime can't parse.
jest.mock('did-jwt', () => ({ ES256KSigner: jest.fn(), hexToBytes: jest.fn() }));
jest.mock('did-jwt-vc', () => ({
  createVerifiableCredentialJwt: jest.fn(),
  verifyCredential: jest.fn(),
}));

import { ConfigService } from '@nestjs/config';
import { Wallet } from 'ethers';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { VcService } from './vc.service';

const config = {
  get: (key: string, def?: string) =>
    key === 'POLYGON_CHAIN_ID' ? '80002' : def,
} as unknown as ConfigService;

describe('VcService — batch signing (1 signature for N credentials)', () => {
  const service = new VcService(config);
  const wallet = new Wallet(
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  );
  const root = '0x' + 'ab'.repeat(32);
  const institution = {
    id: 'inst-1',
    name: 'DUT',
    signingAddress: wallet.address,
    blockchainAddress: null,
  } as unknown as Institution;
  const candidate = { id: 'user-1', fullName: 'Nguyen Van A' } as User;
  const credential = {
    id: 'cred-1',
    credentialNumber: 'DUT-1',
    title: 'BSc',
    credentialHash: '0x' + '11'.repeat(32),
    issuedDate: new Date('2026-01-01'),
    merkleRoot: root,
    merkleProof: ['0x' + '22'.repeat(32)],
    leafIndex: 0,
  } as unknown as Credential;

  async function signedVc() {
    const td = service.buildBatchTypedData({
      merkleRoot: root,
      institution,
      count: 3,
      issuedAt: '2026-01-01T00:00:00.000Z',
    });
    const sig = await wallet.signTypedData(
      td.domain,
      { Batch: [...td.types.Batch] },
      td.message,
    );
    return service.assembleBatchVc({
      credential,
      candidate,
      institutionName: institution.name,
      batchTypedData: td,
      batchSignature: sig,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  }

  it('verifies a batch-signed VC (signer = issuer, root matches)', async () => {
    const vc = await signedVc();
    const r = service.verifyBatchEip712(vc);
    expect(r.valid).toBe(true);
    expect(r.signerAddress).toBe(wallet.address.toLowerCase());
  });

  it('rejects when the signed batch root is tampered', async () => {
    const vc = await signedVc();
    (
      (vc as Record<string, unknown>).proof as {
        eip712: { message: { merkleRoot: string } };
      }
    ).eip712.message.merkleRoot = '0x' + 'cd'.repeat(32);
    expect(service.verifyBatchEip712(vc).valid).toBe(false);
  });

  it('rejects a per-credential proof (not a Batch primaryType)', () => {
    const r = service.verifyBatchEip712({
      proof: { type: 'EthereumEip712Signature2021', eip712: { primaryType: 'Credential' } },
    });
    expect(r.valid).toBe(false);
  });
});
