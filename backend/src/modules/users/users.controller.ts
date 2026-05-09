import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireActions } from '../auth/decorators/require-actions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiOkResponse({ description: 'Current user profile' })
  async getMe(@CurrentUser() user: User) {
    const full = await this.usersService.findById(user.id);
    const { passwordHash: _ph, ...rest } = full;
    return rest;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Updated user profile' })
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.updateMe(user.id, dto);
    const { passwordHash: _ph, ...rest } = updated;
    return rest;
  }

  @Get('lookup')
  @RequireActions('credential.issue')
  @ApiOperation({
    summary: 'Resolve a candidate by email (for issue credential UI)',
  })
  @ApiQuery({ name: 'email', required: true })
  @ApiOkResponse({ description: 'Candidate id + display info' })
  async lookupByEmail(@Query('email') email: string) {
    if (!email) throw new NotFoundException('Email required');
    const user = await this.usersService.findByEmail(email);
    if (!user || user.role !== UserRole.CANDIDATE) {
      throw new NotFoundException('No candidate found with that email');
    }
    return { id: user.id, email: user.email, fullName: user.fullName };
  }
}
