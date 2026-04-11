import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruiterProfile } from '../../database/entities/recruiter-profile.entity';
import { AuthModule } from '../auth/auth.module';
import { RecruiterProfilesController } from './recruiter-profiles.controller';
import { RecruiterProfilesService } from './recruiter-profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecruiterProfile]), AuthModule],
  controllers: [RecruiterProfilesController],
  providers: [RecruiterProfilesService],
  exports: [RecruiterProfilesService],
})
export class RecruiterProfilesModule {}
