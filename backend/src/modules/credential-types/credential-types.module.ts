import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialType } from '../../database/entities/credential-type.entity';
import { AuthModule } from '../auth/auth.module';
import { CredentialTypesController } from './credential-types.controller';
import { CredentialTypesService } from './credential-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([CredentialType]), AuthModule],
  controllers: [CredentialTypesController],
  providers: [CredentialTypesService],
  exports: [CredentialTypesService],
})
export class CredentialTypesModule {}
