import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Edit a self-declared skill (name and/or proficiency). */
export class UpdateCandidateSkillDto {
  @ApiPropertyOptional({ example: 'React' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  skillName?: string;

  @ApiPropertyOptional({ example: 'Advanced' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  proficiencyLevel?: string;
}
