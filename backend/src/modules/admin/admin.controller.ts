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
import { UserRole } from '../../database/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireActions } from '../auth/decorators/require-actions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AdminService } from './admin.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
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
    @CurrentUser() admin: User,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.admin.updateUserStatus(id, dto.status, admin.id);
  }

  // ───────────── Action overrides ─────────────

  @Get('actions')
  @RequireActions('admin.users')
  @ApiOperation({
    summary:
      'List action codes. Pass ?role= to filter to only actions for that role.',
  })
  async listActions(@Query('role') role?: UserRole) {
    return this.admin.listActions(role);
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
    @CurrentUser() admin: User,
  ) {
    await this.admin.removeOverride(userId, actionId, admin.id);
  }

  // ───────────── Blockchain ─────────────

  @Get('blockchain/transactions')
  @RequireActions('admin.blockchain')
  @ApiOperation({ summary: 'List blockchain transactions (status filter)' })
  async listTransactions(@Query() query: ListTxQuery) {
    return this.admin.listTransactions(query);
  }

  // ───────────── Audit logs ─────────────

  @Get('audit-logs')
  @RequireActions('admin.dashboard')
  @ApiOperation({ summary: 'Query audit log entries (latest first)' })
  async listAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listAuditLogs({
      userId,
      action,
      entityType,
      entityId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('announcements')
  @HttpCode(HttpStatus.OK)
  @RequireActions('admin.manage')
  @ApiOperation({
    summary: 'Broadcast a system announcement to all users (or a specific role)',
  })
  @ApiOkResponse({ description: 'Number of users notified' })
  async sendAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.admin.broadcastAnnouncement(dto);
  }
}
