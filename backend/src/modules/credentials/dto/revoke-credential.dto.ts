import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeCredentialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
