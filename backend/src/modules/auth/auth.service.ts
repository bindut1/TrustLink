import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { User } from '../../database/entities/user.entity';
import { Institution } from '../../database/entities/institution.entity';
import { CandidateProfile } from '../../database/entities/candidate-profile.entity';
import { RecruiterProfile } from '../../database/entities/recruiter-profile.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { AccountStatus, ApprovalStatus, UserRole } from '../../database/enums';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload';

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    private readonly email: EmailService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot self-register as admin');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.dataSource.transaction(async (manager) => {
      const created = manager.create(User, {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        status: AccountStatus.ACTIVE,
      });
      const savedUser = await manager.save(created);

      if (dto.role === UserRole.ISSUER) {
        const institution = manager.create(Institution, {
          userId: savedUser.id,
          name: dto.institutionName!,
          institutionType: dto.institutionType!,
          taxCode: dto.taxCode ?? null,
          website: dto.website ?? null,
          approvalStatus: ApprovalStatus.PENDING,
        });
        await manager.save(institution);
      } else if (dto.role === UserRole.CANDIDATE) {
        const profile = manager.create(CandidateProfile, {
          userId: savedUser.id,
        });
        await manager.save(profile);
      } else if (dto.role === UserRole.RECRUITER) {
        const profile = manager.create(RecruiterProfile, {
          userId: savedUser.id,
          companyName: dto.companyName!,
          industry: dto.industry ?? null,
          companySize: dto.companySize ?? null,
        });
        await manager.save(profile);
      }

      return savedUser;
    });

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const tokens = await this.issueTokens(user);

    await this.auditLogs.record({
      userId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
    });

    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash, revokedAt: IsNull() },
      relations: ['user'],
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (stored.user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    stored.revokedAt = new Date();
    await this.refreshTokenRepo.save(stored);

    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokenRepo.save(stored);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const reset = this.resetTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    await this.resetTokenRepo.save(reset);

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.email.sendPasswordReset(user.email, resetUrl);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Account not found');
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must differ from current password',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, userId, { passwordHash });
      await manager.update(
        RefreshToken,
        { userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    });

    await this.auditLogs.record({
      userId,
      action: 'auth.password_change',
      entityType: 'user',
      entityId: userId,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const stored = await this.resetTokenRepo.findOne({
      where: { tokenHash },
    });
    if (!stored || stored.usedAt) {
      throw new BadRequestException('Invalid or already used token');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Token expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, stored.userId, { passwordHash });
      stored.usedAt = new Date();
      await manager.save(stored);
      await manager.update(
        RefreshToken,
        { userId: stored.userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    });
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const refreshEntity = this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    await this.refreshTokenRepo.save(refreshEntity);

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
