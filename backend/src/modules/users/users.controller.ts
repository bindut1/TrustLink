import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireActions } from '../auth/decorators/require-actions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_BYTES },
    }),
  )
  @ApiOperation({ summary: 'Upload/replace the current user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Updated user profile with new avatarUrl' })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const updated = await this.usersService.updateAvatar(user.id, file);
    const { passwordHash: _ph, ...rest } = updated;
    return rest;
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove the current user avatar' })
  @ApiOkResponse({ description: 'Updated user profile with avatarUrl cleared' })
  async removeAvatar(@CurrentUser() user: User) {
    const updated = await this.usersService.removeAvatar(user.id);
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

  @Get('candidates/search')
  @RequireActions('credential.issue')
  @ApiOperation({
    summary: 'Search candidates by name or email (typeahead for issue UI)',
  })
  @ApiQuery({ name: 'q', required: true })
  @ApiOkResponse({ description: 'Up to 10 matching candidates' })
  async searchCandidates(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return [];
    return this.usersService.searchCandidates(q);
  }
}
