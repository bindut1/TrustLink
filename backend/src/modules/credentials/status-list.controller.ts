import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatusListService } from './status-list.service';

@ApiTags('Public — Status List (revocation)')
@Controller('status-list')
export class StatusListController {
  constructor(private readonly statusList: StatusListService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Public StatusList2021 revocation list (no auth required)',
    description:
      'Returns the StatusList2021Credential whose encoded bitstring marks revoked credentials.',
  })
  @ApiOkResponse({ description: 'StatusList2021Credential' })
  async getStatusList(@Param('id', ParseIntPipe) id: number) {
    return this.statusList.buildStatusListCredential(id);
  }
}
