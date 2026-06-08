import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ description: 'Display name, e.g. "Node.js"' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description:
      'Canonical match token. Defaults to lowercased name. This is the key the matcher compares.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  normalized?: string;

  @ApiPropertyOptional({ description: 'Grouping, e.g. backend / frontend / data' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ type: [String], description: 'Variants that resolve to this skill' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  aliases?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
