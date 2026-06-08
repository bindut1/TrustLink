import {
  Body,
  Controller,
  Delete,
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
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@ApiTags('Skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'List the active skill catalog (for pickers)' })
  @ApiOkResponse({ description: 'Active skill catalog entries' })
  async findAll() {
    return this.service.findAll();
  }

  @Get('all')
  @RequireActions('skill.manage')
  @ApiOperation({ summary: 'List all skills incl. inactive (admin only)' })
  @ApiOkResponse({ description: 'All skill catalog entries' })
  async findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Post()
  @RequireActions('skill.manage')
  @ApiOperation({ summary: 'Create a skill (admin only)' })
  @ApiCreatedResponse({ description: 'Created skill' })
  async create(@Body() dto: CreateSkillDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequireActions('skill.manage')
  @ApiOperation({ summary: 'Update a skill (admin only)' })
  @ApiOkResponse({ description: 'Updated skill' })
  async update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequireActions('skill.manage')
  @ApiOperation({ summary: 'Delete a skill (admin only)' })
  @ApiOkResponse({ description: 'Deletion result' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
