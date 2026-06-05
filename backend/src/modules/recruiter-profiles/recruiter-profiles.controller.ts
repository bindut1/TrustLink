import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../../database/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RecruiterProfilesService } from './recruiter-profiles.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';

@ApiTags('Recruiter Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('recruiter-profiles')
export class RecruiterProfilesController {
  constructor(private readonly service: RecruiterProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the current recruiter's own profile" })
  @ApiOkResponse({ description: 'Recruiter profile owned by the current user' })
  async findMine(@CurrentUser() user: User) {
    return this.service.findByUserId(user.id);
  }

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Aggregate dashboard for the recruiter' })
  @ApiOkResponse({ description: 'Recruiter dashboard aggregates' })
  async getMyDashboard(@CurrentUser() user: User) {
    return this.service.getDashboard(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View recruiter/company profile by ID' })
  @ApiOkResponse({ description: 'Recruiter profile' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own recruiter profile' })
  @ApiOkResponse({ description: 'Updated recruiter profile' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateRecruiterProfileDto,
  ) {
    return this.service.updateByUserId(user.id, dto);
  }
}
