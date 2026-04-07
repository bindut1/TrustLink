import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
