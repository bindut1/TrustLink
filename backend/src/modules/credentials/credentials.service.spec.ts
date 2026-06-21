import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { keccak256, toUtf8Bytes } from 'ethers';
import {
  ApprovalStatus,
  CredentialStatus,
  NotificationType,
  UserRole,
  VerificationResult,
} from '../../database/enums';
import { buildMerkleTree, getProof } from '../blockchain/merkle';
import { CredentialsService } from './credentials.service';

const ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

function makeMocks() {
  const credRepo = {
    findOne: jest.fn(() => Promise.resolve(null)),
    find: jest.fn(() => Promise.resolve([])),
    save: jest.fn((c: unknown) => Promise.resolve(c)),
  };
  const typeRepo = { findOne: jest.fn() };
  const institutionRepo = {
    findOne: jest.fn(() => Promise.resolve(null)),
    save: jest.fn((i: unknown) => Promise.resolve(i)),
  };
  const userRepo = { findOne: jest.fn(() => Promise.resolve(null)) };
  const skillRepo = {
    update: jest.fn(() => Promise.resolve(undefined)),
    delete: jest.fn(() => Promise.resolve({ affected: 0 })),
  };
  const verificationCacheRepo = {
    findOne: jest.fn(() => Promise.resolve(null)),
    save: jest.fn((c: unknown) => Promise.resolve(c)),
    create: jest.fn((d: unknown) => d),
  };
  const dataSource = { transaction: jest.fn() };
  const config = { get: jest.fn((_k: string, def?: string) => def) };
  const notifications = { create: jest.fn(() => Promise.resolve(undefined)) };
  const blockchain = {
    isReady: jest.fn(() => false),
    isIssuerAuthorized: jest.fn(() => Promise.resolve(false)),
    addIssuerOnChain: jest.fn(() => Promise.resolve(undefined)),
    recordLeafRevocation: jest.fn(() => Promise.resolve(undefined)),
    computeCredentialHash: jest.fn(() => '0x' + '11'.repeat(32)),
    isLeafRevokedOnChain: jest.fn(() => Promise.resolve(false)),
    verifyBatchOnChain: jest.fn(),
  };
  const vcService = {
    verifyEip712: jest.fn(),
    verifyBatchEip712: jest.fn(),
    buildCredentialTypedData: jest.fn(),
    buildBatchTypedData: jest.fn(),
    assembleEip712Vc: jest.fn(),
    assembleBatchVc: jest.fn(),
    buildAnchorEvidence: jest.fn(() => null),
  };
  const auditLogs = { record: jest.fn(() => Promise.resolve(undefined)) };
  const statusList = {
    revokeByCredential: jest.fn(() => Promise.resolve(undefined)),
    isRevoked: jest.fn(() => Promise.resolve(false)),
    assignEntry: jest.fn(),
    buildCredentialStatus: jest.fn(),
  };
  const skills = { resolve: jest.fn() };
  const embeddings = {
    updateCandidateEmbedding: jest.fn(() => Promise.resolve(undefined)),
  };

  const service = new CredentialsService(
    credRepo as never,
    typeRepo as never,
    institutionRepo as never,
    userRepo as never,
    skillRepo as never,
    verificationCacheRepo as never,
    dataSource as never,
    config as never,
    notifications as never,
    blockchain as never,
    vcService as never,
    auditLogs as never,
    statusList as never,
    skills as never,
    embeddings as never,
  );

  return {
    service,
    credRepo,
    institutionRepo,
    userRepo,
    skillRepo,
    verificationCacheRepo,
    config,
    notifications,
    blockchain,
    vcService,
    auditLogs,
    statusList,
    embeddings,
  };
}

function institution(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inst-1',
    userId: 'issuer-1',
    name: 'DUT',
    approvalStatus: ApprovalStatus.APPROVED,
    signingAddress: ADDRESS.toLowerCase(),
    blockchainAddress: ADDRESS.toLowerCase(),
    ...overrides,
  };
}

describe('CredentialsService.registerIssuerWallet', () => {
  it('rejects an issuer without an institution', async () => {
    const m = makeMocks();
    await expect(
      m.service.registerIssuerWallet('issuer-1', ADDRESS),
    ).rejects.toThrow(ForbiddenException);
  });

  it('stores the lowercased address as both signing and identity address', async () => {
    const m = makeMocks();
    const inst = institution({ signingAddress: null, blockchainAddress: null });
    m.institutionRepo.findOne.mockResolvedValue(inst as never);

    const result = await m.service.registerIssuerWallet('issuer-1', ADDRESS);

    expect(result.signingAddress).toBe(ADDRESS.toLowerCase());
    expect(inst.signingAddress).toBe(ADDRESS.toLowerCase());
    expect(inst.blockchainAddress).toBe(ADDRESS.toLowerCase());
    expect(m.institutionRepo.save).toHaveBeenCalledWith(inst);
  });

  it('reports authorized=false when the chain is not configured', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    const result = await m.service.registerIssuerWallet('issuer-1', ADDRESS);
    expect(result.authorized).toBe(false);
    expect(m.blockchain.addIssuerOnChain).not.toHaveBeenCalled();
  });

  it('skips addIssuer when the wallet is already authorized on-chain', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    m.blockchain.isReady.mockReturnValue(true);
    m.blockchain.isIssuerAuthorized.mockResolvedValue(true);

    const result = await m.service.registerIssuerWallet('issuer-1', ADDRESS);

    expect(result.authorized).toBe(true);
    expect(m.blockchain.addIssuerOnChain).not.toHaveBeenCalled();
  });

  it('authorizes the wallet on-chain when not yet authorized', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    m.blockchain.isReady.mockReturnValue(true);

    const result = await m.service.registerIssuerWallet('issuer-1', ADDRESS);

    expect(m.blockchain.addIssuerOnChain).toHaveBeenCalledWith(
      expect.objectContaining({ address: ADDRESS.toLowerCase() }),
    );
    expect(result.authorized).toBe(true);
  });

  it('still registers the wallet when on-chain authorization fails', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    m.blockchain.isReady.mockReturnValue(true);
    m.blockchain.isIssuerAuthorized.mockRejectedValue(new Error('RPC down'));

    const result = await m.service.registerIssuerWallet('issuer-1', ADDRESS);

    expect(result.signingAddress).toBe(ADDRESS.toLowerCase());
    expect(result.authorized).toBe(false);
  });
});

describe('CredentialsService.disconnectIssuerWallet', () => {
  it('clears both addresses', async () => {
    const m = makeMocks();
    const inst = institution();
    m.institutionRepo.findOne.mockResolvedValue(inst as never);

    const result = await m.service.disconnectIssuerWallet('issuer-1');

    expect(result.disconnected).toBe(true);
    expect(inst.signingAddress).toBeNull();
    expect(inst.blockchainAddress).toBeNull();
  });

  it('rejects an issuer without an institution', async () => {
    const m = makeMocks();
    await expect(m.service.disconnectIssuerWallet('x')).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('CredentialsService.prepareBatch — guard rails', () => {
  const dto = { items: [] };

  it('rejects an issuer without an institution', async () => {
    const m = makeMocks();
    await expect(m.service.prepareBatch('issuer-1', dto)).rejects.toThrow(
      'Issuer has no registered institution',
    );
  });

  it('rejects an unapproved institution', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(
      institution({ approvalStatus: ApprovalStatus.PENDING }) as never,
    );
    await expect(m.service.prepareBatch('issuer-1', dto)).rejects.toThrow(
      'Institution is not approved',
    );
  });

  it('rejects when no signing wallet is registered', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(
      institution({ signingAddress: null }) as never,
    );
    await expect(m.service.prepareBatch('issuer-1', dto)).rejects.toThrow(
      'Register the issuer signing wallet before issuing',
    );
  });
});

describe('CredentialsService.anchorBatch — trust guard chain', () => {
  const leaf = (s: string) => keccak256(toUtf8Bytes(s));
  const leaves = [leaf('cred-a'), leaf('cred-b')];
  const tree = buildMerkleTree(leaves);

  function preparedCreds() {
    return leaves.map((hash, i) => ({
      id: `cred-${i}`,
      candidateId: `cand-${i}`,
      title: `Degree ${i}`,
      credentialHash: hash,
      merkleRoot: tree.root,
      leafIndex: i,
      merkleProof: getProof(tree, i),
      status: CredentialStatus.PENDING,
    }));
  }

  const dto = {
    merkleRoot: tree.root,
    txHash: '0x' + 'ff'.repeat(32),
    signatures: [],
  };

  it('rejects an issuer without an institution', async () => {
    const m = makeMocks();
    await expect(m.service.anchorBatch('issuer-1', dto)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects when no credentials were prepared for the root', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    await expect(m.service.anchorBatch('issuer-1', dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects when the submitted root does not match the prepared credentials', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    m.credRepo.find.mockResolvedValue(preparedCreds() as never);
    await expect(
      m.service.anchorBatch('issuer-1', {
        ...dto,
        merkleRoot: '0x' + 'aa'.repeat(32),
      }),
    ).rejects.toThrow('Merkle root does not match the prepared credentials');
  });

  it('rejects when the root is not anchored on-chain', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    m.credRepo.find.mockResolvedValue(preparedCreds() as never);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: false,
      issuer: '0x0',
      timestamp: 0,
      isRevoked: false,
    } as never);
    await expect(m.service.anchorBatch('issuer-1', dto)).rejects.toThrow(
      'Merkle root is not anchored on-chain yet',
    );
  });

  it('rejects when the batch was anchored by a different wallet', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    m.credRepo.find.mockResolvedValue(preparedCreds() as never);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: true,
      issuer: '0x' + '99'.repeat(20),
      timestamp: 1,
      isRevoked: false,
    } as never);
    await expect(m.service.anchorBatch('issuer-1', dto)).rejects.toThrow(
      'Batch was anchored by a different address',
    );
  });

  it('rejects an invalid issuer signature instead of storing the VC', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    const creds = preparedCreds();
    m.credRepo.find.mockResolvedValue(creds as never);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: true,
      issuer: ADDRESS,
      timestamp: 1,
      isRevoked: false,
    } as never);
    m.userRepo.findOne.mockResolvedValue({ id: 'cand-0' } as never);
    m.vcService.buildCredentialTypedData.mockReturnValue({
      message: { issuerDid: `did:ethr:polygon:${ADDRESS.toLowerCase()}` },
    } as never);
    m.statusList.assignEntry.mockResolvedValue({} as never);
    m.vcService.assembleEip712Vc.mockReturnValue({} as never);
    m.vcService.verifyEip712.mockReturnValue({
      valid: false,
      signerAddress: null,
    } as never);

    await expect(
      m.service.anchorBatch('issuer-1', {
        ...dto,
        signatures: [{ credentialId: 'cred-0', signature: '0xbad' }],
      }),
    ).rejects.toThrow('Invalid issuer signature');
    expect(m.credRepo.save).not.toHaveBeenCalled();
  });

  it('anchors credentials with valid signatures and verifies skills', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    const creds = preparedCreds();
    m.credRepo.find.mockResolvedValue(creds as never);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: true,
      issuer: ADDRESS,
      timestamp: 1700000000,
      isRevoked: false,
    } as never);
    m.userRepo.findOne.mockImplementation(((args: {
      where: { id: string };
    }) =>
      Promise.resolve({
        id: args.where.id,
        fullName: 'Candidate',
      })) as never);
    m.vcService.buildCredentialTypedData.mockReturnValue({
      message: { issuerDid: `did:ethr:polygon:${ADDRESS.toLowerCase()}` },
    } as never);
    m.statusList.assignEntry.mockResolvedValue({} as never);
    m.statusList.buildCredentialStatus.mockReturnValue({} as never);
    m.vcService.assembleEip712Vc.mockReturnValue({ vc: true } as never);
    m.vcService.verifyEip712.mockReturnValue({
      valid: true,
      signerAddress: ADDRESS.toLowerCase(),
    } as never);

    const result = await m.service.anchorBatch('issuer-1', {
      ...dto,
      signatures: [
        { credentialId: 'cred-0', signature: '0xsig0' },
        { credentialId: 'cred-1', signature: '0xsig1' },
      ],
    });

    expect(result.anchored).toBe(2);
    expect(creds[0].status).toBe(CredentialStatus.ISSUED);
    expect(m.skillRepo.update).toHaveBeenCalledWith(
      { sourceCredentialId: 'cred-0' },
      { isVerified: true },
    );
    expect(m.notifications.create).toHaveBeenCalledTimes(2);
    expect(m.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.CREDENTIAL_ISSUED }),
    );
  });

  it('skips credentials without a submitted signature', async () => {
    const m = makeMocks();
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    m.credRepo.find.mockResolvedValue(preparedCreds() as never);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: true,
      issuer: ADDRESS,
      timestamp: 1,
      isRevoked: false,
    } as never);

    const result = await m.service.anchorBatch('issuer-1', dto); // no signatures
    expect(result.anchored).toBe(0);
  });
});

describe('CredentialsService.revoke', () => {
  function issuedCredential(overrides: Record<string, unknown> = {}) {
    return {
      id: 'cred-1',
      title: 'BSc',
      institutionId: 'inst-1',
      candidateId: 'cand-1',
      status: CredentialStatus.ISSUED,
      ...overrides,
    };
  }

  it('rejects an unknown credential', async () => {
    const m = makeMocks();
    await expect(
      m.service.revoke('cred-1', 'issuer-1', { reason: 'fraud' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects revocation by a non-issuing institution', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(
      issuedCredential({ institutionId: 'other-inst' }) as never,
    );
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    await expect(
      m.service.revoke('cred-1', 'issuer-1', { reason: 'fraud' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects double revocation', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(
      issuedCredential({ status: CredentialStatus.REVOKED }) as never,
    );
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);
    await expect(
      m.service.revoke('cred-1', 'issuer-1', { reason: 'fraud' }),
    ).rejects.toThrow('Credential is already revoked');
  });

  it('revokes off-chain (chain not configured): status list bit, notification and audit', async () => {
    const m = makeMocks();
    const cred = issuedCredential();
    m.credRepo.findOne.mockResolvedValue(cred as never);
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);

    const saved = await m.service.revoke('cred-1', 'issuer-1', {
      reason: 'data entry error',
    });

    expect(saved.status).toBe(CredentialStatus.REVOKED);
    expect(saved.revocationReason).toBe('data entry error');
    expect(m.statusList.revokeByCredential).toHaveBeenCalledWith('cred-1');
    // isReady() is false in dev mock → no on-chain leaf-revoke recorded.
    expect(m.blockchain.recordLeafRevocation).not.toHaveBeenCalled();
    expect(m.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cand-1',
        type: NotificationType.CREDENTIAL_REVOKED,
        message: expect.stringContaining('data entry error'),
      }),
    );
    expect(m.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.revoke' }),
    );
  });

  it('removes the credential-derived skills and refreshes the embedding on revoke', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(issuedCredential() as never);
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);

    await m.service.revoke('cred-1', 'issuer-1', { reason: 'fraud' });

    // Only the skills this credential sourced are dropped; self-declared rows
    // (source_credential_id = null) are left untouched.
    expect(m.skillRepo.delete).toHaveBeenCalledWith({
      sourceCredentialId: 'cred-1',
    });
    expect(m.embeddings.updateCandidateEmbedding).toHaveBeenCalledWith('cand-1');
  });

  it('records the issuer-signed revokeLeaf when the chain is configured', async () => {
    const m = makeMocks();
    m.blockchain.isReady.mockReturnValue(true);
    m.credRepo.findOne.mockResolvedValue(issuedCredential() as never);
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);

    const txHash = '0x' + 'ab'.repeat(32);
    const saved = await m.service.revoke('cred-1', 'issuer-1', {
      reason: 'fraud',
      txHash,
    });

    expect(saved.status).toBe(CredentialStatus.REVOKED);
    expect(m.blockchain.recordLeafRevocation).toHaveBeenCalledWith(
      expect.objectContaining({ credentialId: 'cred-1', txHash }),
    );
    expect(m.statusList.revokeByCredential).toHaveBeenCalledWith('cred-1');
  });

  it('rejects revoke without a txHash when the chain is configured', async () => {
    const m = makeMocks();
    m.blockchain.isReady.mockReturnValue(true);
    m.credRepo.findOne.mockResolvedValue(issuedCredential() as never);
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);

    await expect(
      m.service.revoke('cred-1', 'issuer-1', { reason: 'fraud' }),
    ).rejects.toThrow('Missing on-chain revoke transaction hash');
    expect(m.blockchain.recordLeafRevocation).not.toHaveBeenCalled();
  });

  it('skips the notification when the credential has no candidate', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(
      issuedCredential({ candidateId: null }) as never,
    );
    m.institutionRepo.findOne.mockResolvedValue(institution() as never);

    await m.service.revoke('cred-1', 'issuer-1', { reason: 'x' });
    expect(m.notifications.create).not.toHaveBeenCalled();
  });
});

describe('CredentialsService.findAll — hidden-candidate visibility', () => {
  function candidate(isOpenToWork: boolean) {
    return {
      id: 'cand-1',
      role: UserRole.CANDIDATE,
      candidateProfile: { isOpenToWork },
    };
  }

  it('blocks a recruiter from listing a hidden candidate’s credentials', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(candidate(false) as never);

    await expect(
      m.service.findAll(
        { candidateId: 'cand-1' } as never,
        { id: 'rec-1', role: UserRole.RECRUITER } as never,
      ),
    ).rejects.toThrow('Candidate has hidden their profile');
    expect(m.credRepo.find).not.toHaveBeenCalled();
  });

  it('allows a recruiter when the candidate is open to work', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(candidate(true) as never);

    await m.service.findAll(
      { candidateId: 'cand-1' } as never,
      { id: 'rec-1', role: UserRole.RECRUITER } as never,
    );
    expect(m.credRepo.find).toHaveBeenCalled();
  });

  it('does not restrict issuers or admins', async () => {
    const m = makeMocks();
    m.userRepo.findOne.mockResolvedValue(candidate(false) as never);

    await m.service.findAll(
      { candidateId: 'cand-1' } as never,
      { id: 'issuer-1', role: UserRole.ISSUER } as never,
    );
    await m.service.findAll(
      { candidateId: 'cand-1' } as never,
      { id: 'admin-1', role: UserRole.ADMIN } as never,
    );
    expect(m.credRepo.find).toHaveBeenCalledTimes(2);
  });

  it('skips the check when no candidateId filter is requested', async () => {
    const m = makeMocks();
    await m.service.findAll(
      {} as never,
      { id: 'rec-1', role: UserRole.RECRUITER } as never,
    );
    expect(m.userRepo.findOne).not.toHaveBeenCalled();
    expect(m.credRepo.find).toHaveBeenCalled();
  });
});

describe('CredentialsService.getVc', () => {
  it('rejects an unknown credential', async () => {
    const m = makeMocks();
    await expect(m.service.getVc('cred-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects a credential without an issued VC', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue({
      id: 'cred-1',
      vcJson: null,
    } as never);
    await expect(m.service.getVc('cred-1')).rejects.toThrow(
      'VC has not been issued for this credential yet',
    );
  });

  it('returns the raw VC with a sanitized filename', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue({
      id: 'cred-1',
      credentialNumber: 'DUT/2026 #01',
      vcJson: { proof: {} },
      issuerDid: 'did:ethr:polygon:0xabc',
    } as never);

    const result = await m.service.getVc('cred-1');

    expect(result.vc).toEqual({ proof: {} });
    expect(result.filename).toBe('DUT-2026-01.vc.jsonld');
  });
});

describe('CredentialsService.verify', () => {
  const STORED_HASH = '0x' + '11'.repeat(32);

  // A single-credential batch (root == leaf == STORED_HASH, empty proof) with a
  // per-credential EIP-712 VC — the simplest full path now that every credential
  // is Merkle-anchored.
  function directCredential(overrides: Record<string, unknown> = {}) {
    return {
      id: 'cred-1',
      credentialHash: STORED_HASH,
      merkleRoot: STORED_HASH,
      merkleProof: [],
      leafIndex: 0,
      status: CredentialStatus.ISSUED,
      vcJson: { proof: { type: 'EthereumEip712Signature2021' } },
      ...overrides,
    };
  }

  function happyChain(m: ReturnType<typeof makeMocks>) {
    m.blockchain.computeCredentialHash.mockReturnValue(STORED_HASH);
    m.vcService.verifyEip712.mockReturnValue({
      valid: true,
      signerAddress: ADDRESS.toLowerCase(),
      issuerDid: `did:ethr:polygon:${ADDRESS.toLowerCase()}`,
    } as never);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: true,
      issuer: ADDRESS,
      timestamp: 1700000000,
      isRevoked: false,
    } as never);
    m.blockchain.isLeafRevokedOnChain.mockResolvedValue(false as never);
    m.blockchain.isIssuerAuthorized.mockResolvedValue(true);
  }

  it('rejects an unknown credential', async () => {
    const m = makeMocks();
    await expect(m.service.verify('cred-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects a credential that was never hashed', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(
      directCredential({ credentialHash: null }) as never,
    );
    await expect(m.service.verify('cred-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns the cached outcome without recomputing', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    m.verificationCacheRepo.findOne.mockResolvedValue({
      result: VerificationResult.VALID,
      onChainVerified: true,
      vcSignatureValid: true,
      issuerAuthorized: true,
      contentIntegrityValid: true,
      verificationDetails: {},
    } as never);

    const outcome = await m.service.verify('cred-1');

    expect(outcome.cached).toBe(true);
    expect(outcome.result).toBe(VerificationResult.VALID);
    expect(m.blockchain.computeCredentialHash).not.toHaveBeenCalled();
  });

  it('verifies a fully valid credential and caches the outcome', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    happyChain(m);

    const outcome = await m.service.verify('cred-1', 'verifier-1');

    expect(outcome).toMatchObject({
      result: VerificationResult.VALID,
      onChainVerified: true,
      vcSignatureValid: true,
      issuerAuthorized: true,
      contentIntegrityValid: true,
      cached: false,
    });
    expect(m.verificationCacheRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialId: 'cred-1',
        result: VerificationResult.VALID,
        verifiedBy: 'verifier-1',
      }),
    );
  });

  it('returns ERROR (not INVALID) when the RPC is unreachable', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    happyChain(m);
    m.blockchain.verifyBatchOnChain.mockRejectedValue(
      new Error('RPC timeout'),
    );

    const outcome = await m.service.verify('cred-1');

    expect(outcome.result).toBe(VerificationResult.ERROR);
    expect(outcome.details.onChainError).toBe('RPC timeout');
  });

  it('returns NOT_FOUND when the batch root is not anchored on-chain', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    happyChain(m);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: false,
      issuer: '0x0',
      timestamp: 0,
      isRevoked: false,
    } as never);

    const outcome = await m.service.verify('cred-1');
    expect(outcome.result).toBe(VerificationResult.NOT_FOUND);
  });

  it('returns REVOKED when the leaf is individually revoked on-chain (Option B)', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    happyChain(m);
    m.blockchain.isLeafRevokedOnChain.mockResolvedValue(true as never);

    const outcome = await m.service.verify('cred-1');

    expect(outcome.result).toBe(VerificationResult.REVOKED);
    expect(
      (outcome.details.onChain as { leafRevoked: boolean }).leafRevoked,
    ).toBe(true);
  });

  it('returns REVOKED when revoked in the DB even if on-chain says active', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(
      directCredential({ status: CredentialStatus.REVOKED }) as never,
    );
    happyChain(m);

    const outcome = await m.service.verify('cred-1');

    expect(outcome.result).toBe(VerificationResult.REVOKED);
    expect(outcome.details.revocationDivergence).toMatchObject({
      dbRevoked: true,
      onChainRevoked: false,
    });
  });

  it('returns REVOKED when only the StatusList2021 bit is set', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    happyChain(m);
    m.statusList.isRevoked.mockResolvedValue(true);

    const outcome = await m.service.verify('cred-1');
    expect(outcome.result).toBe(VerificationResult.REVOKED);
  });

  it('returns INVALID when the content hash no longer matches (tampering)', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    happyChain(m);
    m.blockchain.computeCredentialHash.mockReturnValue('0x' + 'ee'.repeat(32));
    // the tampered hash also isn't on-chain under the recomputed value, but the
    // anchor lookup is mocked as existing — content integrity alone must fail it
    const outcome = await m.service.verify('cred-1');

    expect(outcome.result).toBe(VerificationResult.INVALID);
    expect(outcome.contentIntegrityValid).toBe(false);
  });

  it('returns INVALID when the VC signature does not verify', async () => {
    const m = makeMocks();
    m.credRepo.findOne.mockResolvedValue(directCredential() as never);
    happyChain(m);
    m.vcService.verifyEip712.mockReturnValue({
      valid: false,
      signerAddress: null,
      issuerDid: null,
      error: 'bad signature',
    } as never);

    const outcome = await m.service.verify('cred-1');
    expect(outcome.result).toBe(VerificationResult.INVALID);
    expect(outcome.vcSignatureValid).toBe(false);
  });

  it('uses the batch (Merkle) integrity path for batch credentials', async () => {
    const m = makeMocks();
    const leaf = (s: string) => keccak256(toUtf8Bytes(s));
    const leaves = [leaf('a'), leaf('b'), leaf('c')];
    const tree = buildMerkleTree(leaves);
    m.credRepo.findOne.mockResolvedValue(
      directCredential({
        merkleRoot: tree.root,
        merkleProof: getProof(tree, 1),
        credentialHash: leaves[1],
        vcJson: {
          proof: {
            type: 'EthereumEip712Signature2021',
            eip712: { primaryType: 'Batch' },
          },
        },
      }) as never,
    );
    m.blockchain.computeCredentialHash.mockReturnValue(leaves[1]);
    m.vcService.verifyBatchEip712.mockReturnValue({
      valid: true,
      signerAddress: ADDRESS.toLowerCase(),
      issuerDid: `did:ethr:polygon:${ADDRESS.toLowerCase()}`,
    } as never);
    m.blockchain.verifyBatchOnChain.mockResolvedValue({
      exists: true,
      issuer: ADDRESS,
      timestamp: 1700000000,
      isRevoked: false,
    } as never);
    m.blockchain.isIssuerAuthorized.mockResolvedValue(true);

    const outcome = await m.service.verify('cred-1');

    expect(outcome.result).toBe(VerificationResult.VALID);
    expect(m.vcService.verifyBatchEip712).toHaveBeenCalled();
    expect(m.blockchain.verifyBatchOnChain).toHaveBeenCalledWith(tree.root);
    expect(
      (outcome.details.contentIntegrity as { mode: string }).mode,
    ).toBe('merkle');
  });
});
