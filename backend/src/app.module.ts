import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CandidateProfilesModule } from './modules/candidate-profiles/candidate-profiles.module';
import { RecruiterProfilesModule } from './modules/recruiter-profiles/recruiter-profiles.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { CredentialTypesModule } from './modules/credential-types/credential-types.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: [
        join(__dirname, '..', '..', '.env'),
        join(__dirname, '..', '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        ...(config.get<TypeOrmModuleOptions>('database') as TypeOrmModuleOptions),
        autoLoadEntities: true,
        entities: [join(__dirname, 'database', 'entities', '*.entity.{ts,js}')],
        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        migrationsTableName: 'migrations',
      }),
    }),
    AuthModule,
    UsersModule,
    CandidateProfilesModule,
    RecruiterProfilesModule,
    InstitutionsModule,
    CredentialTypesModule,
    CredentialsModule,
    NotificationsModule,
    JobsModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
