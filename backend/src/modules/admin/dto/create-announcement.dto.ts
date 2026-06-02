import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../../../database/enums';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({ description: 'Announcement body' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Target role — omit to broadcast to all users',
  })
  @IsOptional()
  @IsEnum(UserRole)
  targetRole?: UserRole;
}
