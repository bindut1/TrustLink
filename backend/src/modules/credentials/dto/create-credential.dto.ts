import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCredentialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  credentialNumber: string;

  @ApiProperty()
  @IsUUID()
  credentialTypeId: string;

  @ApiProperty()
  @IsUUID()
  candidateId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  issuedDate: string;

  @ApiPropertyOptional({ example: '2029-06-15' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({
    description: 'Dynamic fields conforming to credential_type.field_schema',
    example: { major: 'Computer Science', gpa: 3.7, classification: 'Giỏi' },
  })
  @IsObject()
  metadata: Record<string, unknown>;
}
