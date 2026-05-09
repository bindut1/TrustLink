import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { ApproveInstitutionDto } from './dto/approve-institution.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionsService } from './institutions.service';

@ApiTags('Institutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly service: InstitutionsService) {}

  @Post()
  @ApiOperation({ summary: 'Register institution (issuer)' })
  @ApiCreatedResponse({ description: 'Institution created' })
  async create(@CurrentUser() user: User, @Body() dto: CreateInstitutionDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all institutions' })
  @ApiOkResponse({ description: 'List of institutions' })
  async findAll() {
    return this.service.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: "Get the current issuer's own institution" })
  @ApiOkResponse({ description: 'Institution owned by the current user' })
  async findMine(@CurrentUser() user: User) {
    return this.service.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get institution detail' })
  @ApiOkResponse({ description: 'Institution detail' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update institution (owner only)' })
  @ApiOkResponse({ description: 'Updated institution' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateInstitutionDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Patch(':id/approve')
  @RequireActions('admin.institutions')
  @ApiOperation({ summary: 'Approve or reject institution (admin only)' })
  @ApiOkResponse({ description: 'Institution approval status updated' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ApproveInstitutionDto,
  ) {
    return this.service.approve(id, user.id, dto);
  }
}
