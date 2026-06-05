import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicStatsService } from './public-stats.service';

@ApiTags('Public — Stats')
@Controller('public')
export class PublicStatsController {
  constructor(private readonly service: PublicStatsService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Public platform aggregates (no auth) for the landing page',
  })
  @ApiOkResponse({ description: 'Non-sensitive aggregate counts' })
  async getStats() {
    return this.service.getStats();
  }
}
