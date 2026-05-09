import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AccountStatus } from '../../../database/enums';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: AccountStatus })
  @IsEnum(AccountStatus, {
    message: 'status must be one of active|inactive|suspended|pending_verification',
  })
  status: AccountStatus;
}
