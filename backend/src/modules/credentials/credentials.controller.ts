import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { CreateCredentialDto } from './dto/create-credential.dto';
import { ListCredentialsQueryDto } from './dto/list-credentials.query.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';

@ApiTags('Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly service: CredentialsService) {}

  @Post()
  @RequireActions('credential.issue')
  @ApiOperation({ summary: 'Issue a new credential (issuer)' })
  @ApiCreatedResponse({ description: 'Credential created in pending status' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateCredentialDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @RequireActions('credential.view')
  @ApiOperation({ summary: 'List credentials with filters' })
  @ApiOkResponse({ description: 'Filtered credential list' })
  async findAll(@Query() query: ListCredentialsQueryDto) {
    return this.service.findAll(query);
  }

  @Get('my')
  @RequireActions('credential.view')
  @ApiOperation({ summary: "List current candidate's credentials" })
  @ApiOkResponse({ description: "Candidate's credentials" })
  async findMy(@CurrentUser() user: User) {
    return this.service.findMy(user.id);
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
  @ApiOperation({ summary: 'Download W3C Verifiable Credential (JWT + JSON)' })
  @ApiOkResponse({ description: 'VC payload' })
  async getVc(@Param('id') id: string) {
    return this.service.getVc(id);
  }

  @Get(':id/verify')
  @RequireActions('credential.verify')
  @ApiOperation({ summary: '1-click credential verification (cached)' })
  @ApiOkResponse({ description: 'Verification outcome' })
  async verify(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.verify(id, user?.id);
  }
}
