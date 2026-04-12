import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CredentialCategory } from '../../../database/enums';

export class CreateCredentialTypeDto {
  @ApiProperty({ enum: CredentialCategory })
  @IsEnum(CredentialCategory)
  category: CredentialCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Dynamic form definition. Shape: { fields: [{ key, label, type, required, options? }] }',
    example: {
      fields: [
        { key: 'major', label: 'Ngành học', type: 'text', required: true },
        { key: 'gpa', label: 'GPA', type: 'number', required: false },
      ],
    },
  })
  @IsObject()
  fieldSchema: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
