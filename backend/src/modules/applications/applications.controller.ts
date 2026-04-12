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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Post('applications')
  @RequireActions('application.create')
  @ApiOperation({ summary: 'Apply to a job (candidate)' })
  @ApiCreatedResponse({ description: 'Application submitted' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.service.create(user, dto);
  }

  @Get('applications/my')
  @RequireActions('application.create')
  @ApiOperation({ summary: "List current candidate's applications" })
  @ApiOkResponse({ description: "Candidate's applications" })
  async findMy(@CurrentUser() user: User) {
    return this.service.findMy(user.id);
  }

  @Get('jobs/:id/applications')
  @RequireActions('application.review')
  @ApiOperation({
    summary: 'List applications for a job (recruiter, owner only)',
  })
  @ApiOkResponse({ description: 'Applications sorted by match_score DESC' })
  async findForJob(@Param('id') jobId: string, @CurrentUser() user: User) {
    return this.service.findForJob(jobId, user.id);
  }

  @Patch('applications/:id')
  @RequireActions('application.review')
  @ApiOperation({ summary: 'Update application status (recruiter)' })
  @ApiOkResponse({ description: 'Updated application' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.service.updateStatus(id, user.id, dto);
  }
}
