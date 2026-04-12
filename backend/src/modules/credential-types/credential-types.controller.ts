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
import { RequireActions } from '../auth/decorators/require-actions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CredentialTypesService } from './credential-types.service';
import { CreateCredentialTypeDto } from './dto/create-credential-type.dto';
import { UpdateCredentialTypeDto } from './dto/update-credential-type.dto';

@ApiTags('Credential Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('credential-types')
export class CredentialTypesController {
  constructor(private readonly service: CredentialTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List active credential types' })
  @ApiOkResponse({ description: 'Active credential types' })
  async findAllActive() {
    return this.service.findAllActive();
  }

  @Post()
  @RequireActions('credential.manage_types')
  @ApiOperation({ summary: 'Create credential type (admin only)' })
  @ApiCreatedResponse({ description: 'Created credential type' })
  async create(@Body() dto: CreateCredentialTypeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequireActions('credential.manage_types')
  @ApiOperation({ summary: 'Update credential type (admin only)' })
  @ApiOkResponse({ description: 'Updated credential type' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCredentialTypeDto,
  ) {
    return this.service.update(id, dto);
  }
}
