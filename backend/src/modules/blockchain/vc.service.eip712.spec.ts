import { ConfigService } from '@nestjs/config';
import { Wallet } from 'ethers';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import { VcService } from './vc.service';

/** Minimal config stub: only POLYGON_CHAIN_ID is read by the EIP-712 path. */
const config = {
  get: (key: string, def?: string) =>
    key === 'POLYGON_CHAIN_ID' ? '80002' : def,
} as unknown as ConfigService;

describe('VcService — EthereumEip712Signature2021', () => {
  const service = new VcService(config);
  const wallet = new Wallet(
    // deterministic test key (NOT a real key)
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  );

  const credential = {
    id: 'cred-1',
    credentialNumber: 'DUT-2026-0001',
    title: 'Bachelor of Engineering',
    credentialHash:
      '0x' + '11'.repeat(32), // bytes32
    issuedDate: new Date('2026-01-15'),
  } as unknown as Credential;

  const institution = {
    id: 'inst-1',
    name: 'Danang University of Technology',
    signingAddress: wallet.address,
    blockchainAddress: null,
  } as unknown as Institution;

  const candidate = { id: 'user-1', fullName: 'Nguyen Van A' } as User;

  async function signVc() {
    const typedData = service.buildCredentialTypedData({
      credential,
      institution,
      candidate,
    });
    const signature = await wallet.signTypedData(
      typedData.domain,
      { Credential: [...typedData.types.Credential] },
      typedData.message,
    );
    const vcJson = service.assembleEip712Vc({
      typedData,
      signature,
      candidate,
      institutionName: institution.name,
      createdAt: '2026-01-15T00:00:00.000Z',
    });
    return vcJson;
  }

  it('verifies a VC signed by the issuer wallet', async () => {
    const vcJson = await signVc();
    const result = service.verifyEip712(vcJson);
    expect(result.valid).toBe(true);
    expect(result.signerAddress).toBe(wallet.address.toLowerCase());
    expect(result.issuerDid).toContain(wallet.address.toLowerCase());
  });

  it('rejects when the signed content is tampered', async () => {
    const vcJson = await signVc();
    // Tamper the message the signature was computed over.
    (
      (vcJson as Record<string, unknown>).proof as {
        eip712: { message: { title: string } };
      }
    ).eip712.message.title = 'Master Degree';
    const result = service.verifyEip712(vcJson);
    expect(result.valid).toBe(false);
  });

  it('rejects when signer does not match the issuer DID', async () => {
    const vcJson = await signVc();
    // Point the DID at a different address than the recovered signer.
    const other = Wallet.createRandom();
    (
      (vcJson as Record<string, unknown>).proof as {
        verificationMethod: string;
      }
    ).verificationMethod = `did:ethr:polygon:${other.address.toLowerCase()}`;
    const result = service.verifyEip712(vcJson);
    expect(result.valid).toBe(false);
  });
});
