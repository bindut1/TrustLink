import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateBatchImportDto {
  @ApiProperty({ description: 'Credential type to apply to every row' })
  @IsUUID()
  credentialTypeId: string;
}
