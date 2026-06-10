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
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { DeclineInvitationDto } from './dto/decline-invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  @Post('jobs/:id/invite/:candidateId')
  @RequireActions('application.review')
  @ApiOperation({
    summary: 'Invite a recommended candidate to apply (recruiter, owner only)',
  })
  @ApiCreatedResponse({ description: 'Invitation sent' })
  async invite(
    @Param('id') jobId: string,
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.service.invite(jobId, candidateId, user, dto);
  }

  @Get('invitations/my')
  @RequireActions('application.create')
  @ApiOperation({ summary: "List the current candidate's invitations" })
  @ApiOkResponse({ description: "Candidate's invitations (offers)" })
  async findMy(@CurrentUser() user: User) {
    return this.service.findMyInvitations(user.id);
  }

  @Get('jobs/:id/invitations')
  @RequireActions('application.review')
  @ApiOperation({
    summary: 'List invitations sent for a job (recruiter, owner only)',
  })
  @ApiOkResponse({ description: 'Invitations sent for the job' })
  async findForJob(@Param('id') jobId: string, @CurrentUser() user: User) {
    return this.service.findForJob(jobId, user.id);
  }

  @Patch('invitations/:id/decline')
  @RequireActions('application.create')
  @ApiOperation({ summary: 'Decline an invitation (candidate)' })
  @ApiOkResponse({ description: 'Updated invitation' })
  async decline(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: DeclineInvitationDto,
  ) {
    return this.service.decline(id, user.id, dto.reason);
  }
}
