import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SetOverrideDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  actionId: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp; null = permanent' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
