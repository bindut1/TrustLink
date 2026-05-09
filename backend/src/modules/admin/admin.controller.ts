import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../../database/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireActions } from '../auth/decorators/require-actions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AdminService } from './admin.service';
import { ListTxQuery } from './dto/list-tx.query';
import { ListUsersQuery } from './dto/list-users.query';
import { SetOverrideDto } from './dto/set-override.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ───────────── Dashboard ─────────────

  @Get('dashboard')
  @RequireActions('admin.dashboard')
  @ApiOperation({ summary: 'System-wide stats for the admin dashboard' })
  @ApiOkResponse({ description: 'Dashboard counts grouped by entity' })
  async dashboard() {
    return this.admin.getDashboardStats();
  }

  // ───────────── Users ─────────────

  @Get('users')
  @RequireActions('admin.users')
  @ApiOperation({ summary: 'List users (search + filter)' })
  async listUsers(@Query() query: ListUsersQuery) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id')
  @RequireActions('admin.users')
  @ApiOperation({ summary: 'Update user account status' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.admin.updateUserStatus(id, dto.status);
  }

  // ───────────── Action overrides ─────────────

  @Get('actions')
  @RequireActions('admin.users')
  @ApiOperation({ summary: 'List all available action codes' })
  async listActions() {
    return this.admin.listActions();
  }

  @Get('users/:id/restrictions')
  @RequireActions('admin.users')
  @ApiOperation({ summary: 'List action overrides for a user' })
  async listOverrides(@Param('id') id: string) {
    return this.admin.listOverrides(id);
  }

  @Post('users/:id/restrictions')
  @RequireActions('admin.users')
  @ApiOperation({ summary: 'Set or update an action override for a user' })
  async setOverride(
    @Param('id') userId: string,
    @CurrentUser() admin: User,
    @Body() dto: SetOverrideDto,
  ) {
    return this.admin.upsertOverride(userId, admin.id, dto);
  }

  @Delete('users/:id/restrictions/:actionId')
  @RequireActions('admin.users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an action override' })
  async removeOverride(
    @Param('id') userId: string,
    @Param('actionId') actionId: string,
  ) {
    await this.admin.removeOverride(userId, actionId);
  }

  // ───────────── Blockchain ─────────────

  @Get('blockchain/transactions')
  @RequireActions('admin.blockchain')
  @ApiOperation({ summary: 'List blockchain transactions (status filter)' })
  async listTransactions(@Query() query: ListTxQuery) {
    return this.admin.listTransactions(query);
  }
}
