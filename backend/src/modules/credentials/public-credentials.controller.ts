import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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

  @Get(':id/vc')
  @ApiOperation({
    summary: 'Download a credential as W3C VC JSON-LD (no auth required)',
    description:
      'Returns the standalone, independently-verifiable VC JSON-LD document ' +
      '(EthereumEip712Signature2021 proof). Lets anyone holding a verify link ' +
      'download the credential for offline / third-party verification.',
  })
  @ApiOkResponse({ description: 'W3C VC JSON-LD document' })
  async downloadPublic(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { vc, filename } = await this.service.getVc(id);
    res
      .header('Content-Type', 'application/ld+json; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .json(vc);
  }
}
