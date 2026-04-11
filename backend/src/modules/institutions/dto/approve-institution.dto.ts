import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApprovalStatus } from '../../../database/enums';

export class ApproveInstitutionDto {
  @ApiProperty({ enum: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] })
  @IsEnum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED], {
    message: 'approvalStatus must be approved or rejected',
  })
  approvalStatus: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED;

  @ApiPropertyOptional()
  @ValidateIf((o: ApproveInstitutionDto) => o.approvalStatus === ApprovalStatus.REJECTED)
  @IsString()
  rejectionReason?: string;
}
