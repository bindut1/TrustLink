import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TxStatus } from '../../../database/enums';

export class ListTxQuery {
  @ApiPropertyOptional({ enum: TxStatus })
  @IsOptional()
  @IsEnum(TxStatus)
  status?: TxStatus;

  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
