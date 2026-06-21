import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import {
  BATCH_EIP712_PRIMARY_TYPE,
  BATCH_EIP712_TYPES,
  BatchEip712Message,
  BatchTypedData,
  CREDENTIAL_EIP712_PRIMARY_TYPE,
  CREDENTIAL_EIP712_TYPES,
  CredentialEip712Message,
  CredentialTypedData,
  Eip712Domain,
  EIP712_PROOF_TYPE,
  buildCredentialDomain,
} from './eip712';

export interface VerifiedVc {
  valid: boolean;
  signerAddress: string | null;
  issuerDid: string | null;
  error?: string;
  payload?: Record<string, unknown>;
}

const DID_METHOD_NETWORK = 'polygon';

/**
 * Builds and verifies W3C Verifiable Credentials using non-custodial
 * EthereumEip712Signature2021 proofs. The issuer signs (per-credential or once
 * per Merkle batch) with their own wallet; this service never holds a key — it
 * only constructs the typed data to sign and verifies the recovered signer
 * against the issuer DID.
 */
@Injectable()
export class VcService {
  private readonly logger = new Logger(VcService.name);

  constructor(private readonly config: ConfigService) {}

  buildIssuerDid(address: string): string {
    return `did:ethr:${DID_METHOD_NETWORK}:${address.toLowerCase()}`;
  }

  parseAddressFromDid(did: string): string | null {
    const m = /^did:ethr:[^:]+:(0x[0-9a-fA-F]{40})$/.exec(did);
    return m ? m[1].toLowerCase() : null;
  }

  // ─────────────────── EthereumEip712Signature2021 (non-custodial) ───────────────────

  /**
   * Build the EIP-712 typed data the issuer's MetaMask will sign. Binds the
   * signature to the credential's canonical hash (also the Merkle leaf).
   */
  buildCredentialTypedData(args: {
    credential: Credential;
    institution: Institution;
    candidate: User;
  }): CredentialTypedData {
    const { credential, institution, candidate } = args;
    const signingAddress =
      institution.signingAddress ?? institution.blockchainAddress;
    if (!signingAddress || !ethers.isAddress(signingAddress)) {
      throw new InternalServerErrorException(
        `Institution ${institution.id} has no valid signing_address — cannot build VC typed data`,
      );
    }
    if (!credential.credentialHash) {
      throw new InternalServerErrorException(
        `Credential ${credential.id} has no hash to bind the signature to`,
      );
    }
    const issuerDid = this.buildIssuerDid(signingAddress);
    const message: CredentialEip712Message = {
      credentialId: credential.id,
      credentialNumber: credential.credentialNumber,
      title: credential.title,
      issuerDid,
      subjectId: `urn:trustlink:user:${candidate.id}`,
      credentialHash: credential.credentialHash,
      issuedDate: this.normalizeDate(credential.issuedDate),
    };
    return {
      domain: buildCredentialDomain(this.chainIdHex()),
      types: CREDENTIAL_EIP712_TYPES,
      primaryType: CREDENTIAL_EIP712_PRIMARY_TYPE,
      message,
    };
  }

  /**
   * Assemble the W3C VC JSON-LD with an EthereumEip712Signature2021 proof, given
   * the issuer's signature over the typed data. Stored on the credential row.
   */
  assembleEip712Vc(args: {
    typedData: CredentialTypedData;
    signature: string;
    candidate: User;
    institutionName: string;
    createdAt: string;
  }): Record<string, unknown> {
    const { typedData, signature, candidate, institutionName, createdAt } = args;
    const m = typedData.message;
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/eip712sig-2021/v1',
      ],
      type: ['VerifiableCredential', 'TrustLinkCredential'],
      id: `urn:trustlink:credential:${m.credentialId}`,
      issuer: { id: m.issuerDid, name: institutionName },
      issuanceDate: createdAt,
      credentialSubject: {
        id: m.subjectId,
        name: candidate.fullName,
        credential: {
          id: m.credentialId,
          credentialNumber: m.credentialNumber,
          title: m.title,
          credentialHash: m.credentialHash,
          issuedDate: m.issuedDate,
        },
      },
      proof: {
        type: EIP712_PROOF_TYPE,
        created: createdAt,
        proofPurpose: 'assertionMethod',
        verificationMethod: m.issuerDid,
        proofValue: signature,
        eip712: {
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: m,
        },
      },
    };
  }

  /**
   * Verify an EthereumEip712Signature2021 proof: recover the signer from the
   * stored typed data + signature and match it to the issuer DID's address.
   */
  verifyEip712(vcJson: Record<string, unknown> | null | undefined): VerifiedVc {
    try {
      const proof = (vcJson?.['proof'] ?? null) as {
        type?: string;
        proofValue?: string;
        verificationMethod?: string;
        eip712?: {
          domain: Eip712Domain;
          types: { Credential: { name: string; type: string }[] };
          message: CredentialEip712Message;
        };
      } | null;

      if (!proof || proof.type !== EIP712_PROOF_TYPE) {
        return {
          valid: false,
          signerAddress: null,
          issuerDid: null,
          error: 'Not an EthereumEip712Signature2021 proof',
        };
      }
      if (!proof.eip712 || !proof.proofValue) {
        return {
          valid: false,
          signerAddress: null,
          issuerDid: null,
          error: 'Malformed EIP-712 proof',
        };
      }

      const recovered = ethers.verifyTypedData(
        proof.eip712.domain,
        { Credential: proof.eip712.types.Credential },
        proof.eip712.message,
        proof.proofValue,
      );
      const issuerDid = proof.verificationMethod ?? null;
      const expected = issuerDid ? this.parseAddressFromDid(issuerDid) : null;
      const valid = !!expected && recovered.toLowerCase() === expected;
      return {
        valid,
        signerAddress: recovered.toLowerCase(),
        issuerDid,
        payload: vcJson as Record<string, unknown>,
        ...(valid
          ? {}
          : { error: 'Recovered signer does not match issuer DID' }),
      };
    } catch (err) {
      return {
        valid: false,
        signerAddress: null,
        issuerDid: null,
        error: (err as Error).message,
      };
    }
  }

  // ─────────────────── Batch signing (1 signature for N credentials) ───────────────────

  /** Typed data the issuer signs ONCE for a whole Merkle batch. */
  buildBatchTypedData(args: {
    merkleRoot: string;
    institution: Institution;
    count: number;
    issuedAt: string;
  }): BatchTypedData {
    const signingAddress =
      args.institution.signingAddress ?? args.institution.blockchainAddress;
    if (!signingAddress || !ethers.isAddress(signingAddress)) {
      throw new InternalServerErrorException(
        `Institution ${args.institution.id} has no valid signing_address`,
      );
    }
    const message: BatchEip712Message = {
      merkleRoot: args.merkleRoot,
      issuerDid: this.buildIssuerDid(signingAddress),
      count: args.count,
      issuedAt: args.issuedAt,
    };
    return {
      domain: buildCredentialDomain(this.chainIdHex()),
      types: BATCH_EIP712_TYPES,
      primaryType: BATCH_EIP712_PRIMARY_TYPE,
      message,
    };
  }

  /**
   * Assemble one credential's VC carrying the SHARED batch signature plus this
   * credential's Merkle proof (proof.eip712.primaryType === 'Batch').
   */
  assembleBatchVc(args: {
    credential: Credential;
    candidate: User;
    institutionName: string;
    batchTypedData: BatchTypedData;
    batchSignature: string;
    createdAt: string;
  }): Record<string, unknown> {
    const { credential, candidate, institutionName, batchTypedData } = args;
    const issuerDid = batchTypedData.message.issuerDid;
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/eip712sig-2021/v1',
      ],
      type: ['VerifiableCredential', 'TrustLinkCredential'],
      id: `urn:trustlink:credential:${credential.id}`,
      issuer: { id: issuerDid, name: institutionName },
      issuanceDate: args.createdAt,
      credentialSubject: {
        id: `urn:trustlink:user:${candidate.id}`,
        name: candidate.fullName,
        credential: {
          id: credential.id,
          credentialNumber: credential.credentialNumber,
          title: credential.title,
          credentialHash: credential.credentialHash,
          issuedDate: this.normalizeDate(credential.issuedDate),
        },
      },
      proof: {
        type: EIP712_PROOF_TYPE,
        created: args.createdAt,
        proofPurpose: 'assertionMethod',
        verificationMethod: issuerDid,
        proofValue: args.batchSignature,
        merkleRoot: credential.merkleRoot,
        merkleProof: credential.merkleProof,
        leafIndex: credential.leafIndex,
        eip712: {
          domain: batchTypedData.domain,
          types: batchTypedData.types,
          primaryType: batchTypedData.primaryType,
          message: batchTypedData.message,
        },
      },
    };
  }

  /**
   * Build a self-describing on-chain anchor (W3C `evidence`, Blockcerts
   * MerkleProof2019 shape) so a third party can verify the credential AGAINST
   * THE CHAIN without TrustLink: it names the network, the registry contract,
   * and the Merkle anchor (root + proof + leaf). NOT part of the signed payload
   * — the chain is the source of truth, so a tampered anchor simply fails the
   * on-chain lookup. Returns null when the contract or root is unknown (e.g.
   * blockchain not configured).
   */
  buildAnchorEvidence(args: {
    credentialHash: string;
    merkleRoot: string | null;
    merkleProof: string[] | null;
    leafIndex: number | null;
    txHash: string | null;
  }): Record<string, unknown>[] | null {
    const contract = this.config.get<string>('CONTRACT_ADDRESS');
    if (!contract || !args.merkleRoot) return null;
    const chainId = this.chainIdHex();
    return [
      {
        type: ['MerkleProof2019'],
        chain: `eip155:${chainId}`,
        chainId,
        contract,
        txHash: args.txHash ?? null,
        merkleRoot: args.merkleRoot,
        merkleProof: args.merkleProof ?? [],
        leafIndex: args.leafIndex ?? 0,
        targetHash: args.credentialHash,
      },
    ];
  }

  /**
   * Verify a batch-signed VC: recover the signer from the (shared) batch
   * signature over the Batch typed data and match it to the issuer DID; also
   * confirm the credential's root equals the signed root. Merkle membership of
   * the leaf is checked separately by the caller.
   */
  verifyBatchEip712(vcJson: Record<string, unknown> | null | undefined): VerifiedVc {
    try {
      const proof = (vcJson?.['proof'] ?? null) as {
        type?: string;
        proofValue?: string;
        verificationMethod?: string;
        merkleRoot?: string;
        eip712?: {
          domain: Eip712Domain;
          types: { Batch: { name: string; type: string }[] };
          primaryType?: string;
          message: BatchEip712Message;
        };
      } | null;

      if (
        !proof ||
        proof.type !== EIP712_PROOF_TYPE ||
        proof.eip712?.primaryType !== BATCH_EIP712_PRIMARY_TYPE ||
        !proof.eip712 ||
        !proof.proofValue
      ) {
        return {
          valid: false,
          signerAddress: null,
          issuerDid: null,
          error: 'Not a batch EthereumEip712Signature2021 proof',
        };
      }

      const recovered = ethers.verifyTypedData(
        proof.eip712.domain,
        { Batch: proof.eip712.types.Batch },
        proof.eip712.message,
        proof.proofValue,
      );
      const issuerDid = proof.verificationMethod ?? null;
      const expected = issuerDid ? this.parseAddressFromDid(issuerDid) : null;
      const rootMatches =
        (proof.merkleRoot ?? '').toLowerCase() ===
        (proof.eip712.message.merkleRoot ?? '').toLowerCase();
      const valid =
        !!expected && recovered.toLowerCase() === expected && rootMatches;
      return {
        valid,
        signerAddress: recovered.toLowerCase(),
        issuerDid,
        payload: vcJson as Record<string, unknown>,
        ...(valid
          ? {}
          : { error: 'Batch signature does not match issuer / root' }),
      };
    } catch (err) {
      return {
        valid: false,
        signerAddress: null,
        issuerDid: null,
        error: (err as Error).message,
      };
    }
  }

  private chainIdHex(): number {
    const raw = this.config.get<string>('POLYGON_CHAIN_ID', '80002');
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 80002;
  }

  private normalizeDate(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
  }
}
