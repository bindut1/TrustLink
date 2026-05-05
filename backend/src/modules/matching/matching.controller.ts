import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
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
import { MatchingService } from './matching.service';

@ApiTags('Matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class MatchingController {
  constructor(private readonly service: MatchingService) {}

  @Get('jobs/:id/recommended-candidates')
  @RequireActions('matching.view')
  @ApiOperation({ summary: 'Top candidates ranked for a job (recruiter)' })
  @ApiOkResponse({ description: 'Candidates ranked by 3-tier score' })
  async recommendedCandidates(
    @Param('id') jobId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.recommendCandidatesForJob(jobId, clampLimit(limit));
  }

  @Get('matching/recommend')
  @RequireActions('matching.view')
  @ApiOperation({ summary: 'Top jobs ranked for the current candidate' })
  @ApiOkResponse({ description: 'Jobs ranked by 3-tier score' })
  async recommendedJobs(
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.recommendJobsForCandidate(user.id, clampLimit(limit));
  }
}

function clampLimit(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(n, 100);
}
