import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ES256KSigner, hexToBytes } from 'did-jwt';
import {
  CredentialPayload,
  Issuer,
  createVerifiableCredentialJwt,
  verifyCredential as verifyVcJwt,
} from 'did-jwt-vc';
import type { Resolvable } from 'did-resolver';
import { ethers } from 'ethers';
import { Credential } from '../../database/entities/credential.entity';
import { Institution } from '../../database/entities/institution.entity';
import { User } from '../../database/entities/user.entity';
import {
  CREDENTIAL_EIP712_PRIMARY_TYPE,
  CREDENTIAL_EIP712_TYPES,
  CredentialEip712Message,
  CredentialTypedData,
  Eip712Domain,
  EIP712_PROOF_TYPE,
  buildCredentialDomain,
} from './eip712';

export interface SignedVc {
  vcJwt: string;
  vcJson: Record<string, unknown>;
  issuerDid: string;
}

export interface VerifiedVc {
  valid: boolean;
  signerAddress: string | null;
  issuerDid: string | null;
  error?: string;
  payload?: Record<string, unknown>;
}

const DID_METHOD_NETWORK = 'polygon';

/**
 * Issues and verifies W3C Verifiable Credentials (JWT format) for the
 * TrustLink credential registry. For MVP, signing uses the server wallet's
 * private key but the issuer DID embeds the institution's blockchain address —
 * verification recovers the signing address from the JWS and matches it back
 * to that DID, so server wallet and institution blockchain_address must align.
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

  /**
   * Build a VC payload + JWT signed with the server wallet's key. Caller is
   * responsible for persisting the result onto the credential row.
   */
  async signCredential(args: {
    credential: Credential;
    institution: Institution;
    candidate: User;
  }): Promise<SignedVc> {
    const { credential, institution, candidate } = args;

    const issuerAddress = institution.blockchainAddress;
    if (!issuerAddress || !ethers.isAddress(issuerAddress)) {
      throw new InternalServerErrorException(
        `Institution ${institution.id} has no valid blockchain_address — cannot sign VC`,
      );
    }

    const issuerDid = this.buildIssuerDid(issuerAddress);
    const signer = this.serverSigner();

    const issuanceDate = (credential.blockchainTimestamp ?? new Date()).toISOString();
    const subjectId = `urn:trustlink:user:${candidate.id}`;

    const payload: CredentialPayload = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'TrustLinkCredential'],
      id: `urn:trustlink:credential:${credential.id}`,
      issuer: { id: issuerDid, name: institution.name },
      issuanceDate,
      ...(credential.expiryDate
        ? { expirationDate: new Date(credential.expiryDate).toISOString() }
        : {}),
      credentialSubject: {
        id: subjectId,
        name: candidate.fullName,
        email: candidate.email,
        credential: {
          id: credential.id,
          credentialNumber: credential.credentialNumber,
          title: credential.title,
          issuedDate: this.normalizeDate(credential.issuedDate),
          expiryDate: credential.expiryDate
            ? this.normalizeDate(credential.expiryDate)
            : null,
          metadata: credential.metadata ?? {},
          credentialHash: credential.credentialHash,
          blockchainTxHash: credential.blockchainTxHash,
          blockchainBlockNumber: credential.blockchainBlockNumber,
        },
      },
    };

    const issuer: Issuer = { did: issuerDid, signer, alg: 'ES256K-R' };
    const vcJwt = await createVerifiableCredentialJwt(payload, issuer);

    return {
      vcJwt,
      vcJson: payload as unknown as Record<string, unknown>,
      issuerDid,
    };
  }

  /**
   * Verify a VC JWT signature using a synthetic ethr DID resolver. Returns
   * `valid=true` only when the JWS recovers to the address embedded in the
   * issuer DID.
   */
  async verifyJwt(jwt: string): Promise<VerifiedVc> {
    try {
      const result = await verifyVcJwt(jwt, this.buildResolver());
      const issuerDid = (result.payload?.iss as string | undefined) ?? null;
      const signerAddress = issuerDid
        ? this.parseAddressFromDid(issuerDid)
        : null;
      return {
        valid: true,
        signerAddress,
        issuerDid,
        payload: result.payload as Record<string, unknown>,
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

  private serverSigner() {
    const privateKey = this.config.get<string>('DEPLOYER_PRIVATE_KEY');
    if (!privateKey) {
      throw new InternalServerErrorException(
        'DEPLOYER_PRIVATE_KEY is not configured — cannot sign VC',
      );
    }
    const stripped = privateKey.startsWith('0x')
      ? privateKey.slice(2)
      : privateKey;
    return ES256KSigner(hexToBytes(stripped), true);
  }

  /**
   * Custom resolver for `did:ethr:polygon:0x...`. We avoid pulling in
   * ethr-did-resolver because Polygon Amoy doesn't host the canonical
   * EthereumDIDRegistry contract; for the MVP we only need the address
   * embedded in the DID to verify ES256K-R signatures.
   */
  private buildResolver(): Resolvable {
    return {
      resolve: async (didUrl: string) => {
        const address = this.parseAddressFromDid(didUrl);
        if (!address) {
          return {
            didDocument: null,
            didDocumentMetadata: {},
            didResolutionMetadata: { error: 'invalidDid' },
          };
        }
        const chainId = this.chainIdHex();
        const verificationMethodId = `${didUrl}#controller`;
        return {
          didDocument: {
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://w3id.org/security/suites/secp256k1recovery-2020/v2',
            ],
            id: didUrl,
            verificationMethod: [
              {
                id: verificationMethodId,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: didUrl,
                blockchainAccountId: `eip155:${chainId}:${address}`,
              },
            ],
            authentication: [verificationMethodId],
            assertionMethod: [verificationMethodId],
          },
          didDocumentMetadata: {},
          didResolutionMetadata: { contentType: 'application/did+ld+json' },
        };
      },
    };
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
