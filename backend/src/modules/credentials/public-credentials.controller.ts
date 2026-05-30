import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CredentialsService } from './credentials.service';

@ApiTags('Public — Credential Verification')
@Controller('public/credentials')
export class PublicCredentialsController {
  constructor(private readonly service: CredentialsService) {}

  @Get(':id/verify')
  @ApiOperation({
    summary: 'Public credential verification (no auth required)',
    description:
      'Returns sanitized credential info + on-chain verification result. Used for verifying a credential by sharing its URL.',
  })
  @ApiOkResponse({
    description: 'Credential details with verification status',
  })
  async verifyPublic(@Param('id', ParseUUIDPipe) id: string) {
    const credential = await this.service.findById(id);
    if (!credential) throw new NotFoundException('Credential not found');

    const verification = await this.service.verify(id);

    return {
      credential: {
        id: credential.id,
        title: credential.title,
        credentialNumber: credential.credentialNumber,
        issuedDate: credential.issuedDate,
        expiryDate: credential.expiryDate,
        status: credential.status,
        revokedAt: credential.revokedAt,
        institution: credential.institution
          ? {
              name: credential.institution.name,
              logoUrl: credential.institution.logoUrl,
              blockchainAddress: credential.institution.blockchainAddress,
            }
          : null,
        candidate: credential.candidate
          ? {
              fullName: credential.candidate.fullName,
            }
          : null,
        credentialType: credential.credentialType
          ? {
              name: credential.credentialType.name,
              category: credential.credentialType.category,
            }
          : null,
        blockchainTxHash: credential.blockchainTxHash,
        blockchainBlockNumber: credential.blockchainBlockNumber,
        issuerDid: credential.issuerDid,
      },
      verification,
    };
  }
}
