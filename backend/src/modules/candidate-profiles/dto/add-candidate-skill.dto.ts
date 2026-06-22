import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * A candidate self-declaring a skill on their own profile. Stored unverified
 * (`is_verified = false`, `source_credential_id = null`); it only becomes
 * verified if an issuer later anchors a credential covering the same skill.
 */
export class AddCandidateSkillDto {
  @ApiProperty({ example: 'React' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  skillName: string;

  @ApiPropertyOptional({ example: 'Intermediate' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  proficiencyLevel?: string;
}
