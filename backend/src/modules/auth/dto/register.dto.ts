import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../database/enums';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  // Issuer fields (required when role = issuer)
  @ValidateIf((o: RegisterDto) => o.role === UserRole.ISSUER)
  @IsString()
  @IsNotEmpty()
  institutionName?: string;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.ISSUER)
  @IsString()
  @IsNotEmpty()
  institutionType?: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsOptional()
  @IsString()
  website?: string;

  // Recruiter fields (required when role = recruiter)
  @ValidateIf((o: RegisterDto) => o.role === UserRole.RECRUITER)
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;
}
