import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../../database/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireActions } from '../auth/decorators/require-actions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CredentialsService } from './credentials.service';
import {
  AnchorBatchDto,
  AnchorBulkDto,
  PrepareBatchDto,
  RegisterIssuerWalletDto,
} from './dto/batch.dto';
import { ListCredentialsQueryDto } from './dto/list-credentials.query.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';

@ApiTags('Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly service: CredentialsService) {}

  @Post('issuer/wallet')
  @RequireActions('credential.issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Register the issuer's non-custodial signing wallet" })
  @ApiOkResponse({ description: 'Signing address registered' })
  async registerWallet(
    @CurrentUser() user: User,
    @Body() dto: RegisterIssuerWalletDto,
  ) {
    return this.service.registerIssuerWallet(user.id, dto.signingAddress);
  }

  @Delete('issuer/wallet')
  @RequireActions('credential.issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Disconnect the issuer's signing wallet (clears it in DB)" })
  @ApiOkResponse({ description: 'Signing wallet cleared' })
  async disconnectWallet(@CurrentUser() user: User) {
    return this.service.disconnectIssuerWallet(user.id);
  }

  @Post('batch/prepare')
  @RequireActions('credential.issue')
  @ApiOperation({
    summary: 'Prepare a credential batch (returns EIP-712 typed data to sign)',
  })
  @ApiCreatedResponse({ description: 'Merkle root + per-credential typed data' })
  async prepareBatch(
    @CurrentUser() user: User,
    @Body() dto: PrepareBatchDto,
  ) {
    return this.service.prepareBatch(user.id, dto);
  }

  @Post('batch/anchor')
  @RequireActions('credential.issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Anchor a signed batch (verify issuer signatures + on-chain root)',
  })
  @ApiOkResponse({ description: 'Number of credentials anchored/issued' })
  async anchorBatch(@CurrentUser() user: User, @Body() dto: AnchorBatchDto) {
    return this.service.anchorBatch(user.id, dto);
  }

  @Post('batch/anchor-bulk')
  @RequireActions('credential.issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Anchor a bulk batch signed once over the Merkle root',
  })
  @ApiOkResponse({ description: 'Number of credentials anchored/issued' })
  async anchorBatchBulk(
    @CurrentUser() user: User,
    @Body() dto: AnchorBulkDto,
  ) {
    return this.service.anchorBatchBulk(user.id, dto);
  }

  @Get()
  @RequireActions('credential.view')
  @ApiOperation({ summary: 'List credentials with filters' })
  @ApiOkResponse({ description: 'Filtered credential list' })
  async findAll(
    @Query() query: ListCredentialsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, user);
  }

  @Get('my')
  @RequireActions('credential.view')
  @ApiOperation({ summary: "List current candidate's credentials" })
  @ApiOkResponse({ description: "Candidate's credentials" })
  async findMy(@CurrentUser() user: User) {
    return this.service.findMy(user.id);
  }

  @Get('batches')
  @RequireActions('credential.view')
  @ApiOperation({ summary: 'List the issuer batch issuance history' })
  @ApiOkResponse({ description: 'Batches grouped by Merkle root' })
  async listBatches(@CurrentUser() user: User) {
    return this.service.listBatches(user.id);
  }

  @Post('batches/:merkleRoot/revoke')
  @RequireActions('credential.revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a whole batch by Merkle root (issuer)' })
  @ApiOkResponse({ description: 'Batch revoked' })
  async revokeBatch(
    @Param('merkleRoot') merkleRoot: string,
    @CurrentUser() user: User,
    @Body() dto: RevokeCredentialDto,
  ) {
    return this.service.revokeBatch(user.id, merkleRoot, dto);
  }

  @Get(':id')
  @RequireActions('credential.view')
  @ApiOperation({ summary: 'Get credential detail (with institution info)' })
  @ApiOkResponse({ description: 'Credential detail' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/revoke')
  @RequireActions('credential.revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke a credential (issuer; only own institution)',
  })
  @ApiOkResponse({ description: 'Credential revoked' })
  async revoke(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RevokeCredentialDto,
  ) {
    return this.service.revoke(id, user.id, dto);
  }

  @Get(':id/vc')
  @RequireActions('credential.download')
  @ApiOperation({ summary: 'Download W3C Verifiable Credential (JSON-LD)' })
  @ApiOkResponse({ description: 'W3C VC JSON-LD document' })
  async getVc(@Param('id') id: string, @Res() res: Response) {
    const { vc, filename } = await this.service.getVc(id);
    res
      .header('Content-Type', 'application/ld+json; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .json(vc);
  }

  @Get(':id/verify')
  @RequireActions('credential.verify')
  @ApiOperation({ summary: '1-click credential verification (cached)' })
  @ApiOkResponse({ description: 'Verification outcome' })
  async verify(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.verify(id, user?.id);
  }
}
