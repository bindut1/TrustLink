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
import { CandidateProfilesService } from './candidate-profiles.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@ApiTags('Candidate Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('candidate-profiles')
export class CandidateProfilesController {
  constructor(private readonly service: CandidateProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the current candidate's own profile" })
  @ApiOkResponse({ description: 'Candidate profile owned by the current user' })
  async findMine(@CurrentUser() user: User) {
    return this.service.findByUserId(user.id);
  }

  @Get('me/skills')
  @ApiOperation({ summary: "Get the current candidate's skills (read-only)" })
  @ApiOkResponse({ description: 'Skills with on-chain verification flag' })
  async findMySkills(@CurrentUser() user: User) {
    return this.service.findSkillsByUserId(user.id);
  }

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Aggregate dashboard counts for the candidate' })
  @ApiOkResponse({ description: 'Credential / application / profile aggregates' })
  async getMyDashboard(@CurrentUser() user: User) {
    return this.service.getDashboard(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View candidate profile by ID' })
  @ApiOkResponse({ description: 'Candidate profile' })
  async findById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findById(id, user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own candidate profile' })
  @ApiOkResponse({ description: 'Updated candidate profile' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.service.updateByUserId(user.id, dto);
  }
}
