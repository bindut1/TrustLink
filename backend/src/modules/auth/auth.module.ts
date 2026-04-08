import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Action } from '../../database/entities/action.entity';
import { CandidateProfile } from '../../database/entities/candidate-profile.entity';
import { Institution } from '../../database/entities/institution.entity';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { RecruiterProfile } from '../../database/entities/recruiter-profile.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { RoleAction } from '../../database/entities/role-action.entity';
import { User } from '../../database/entities/user.entity';
import { UserActionOverride } from '../../database/entities/user-action-override.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnershipGuard } from './guards/ownership.guard';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionsService } from './permissions.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Institution,
      CandidateProfile,
      RecruiterProfile,
      RefreshToken,
      PasswordResetToken,
      Action,
      RoleAction,
      UserActionOverride,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'change_me',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PermissionsService,
    JwtStrategy,
    JwtAuthGuard,
    PermissionGuard,
    OwnershipGuard,
  ],
  exports: [
    AuthService,
    PermissionsService,
    JwtAuthGuard,
    PermissionGuard,
    OwnershipGuard,
    JwtModule,
  ],
})
export class AuthModule {}
