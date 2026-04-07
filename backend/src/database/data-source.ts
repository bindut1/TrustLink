import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// Load env from repo root (one level above backend/) and backend/.env as fallback.
loadEnv({ path: join(__dirname, '..', '..', '..', '.env') });
loadEnv({ path: join(__dirname, '..', '..', '.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'trustlink',
  password: process.env.DB_PASSWORD || 'trustlink_secret',
  database: process.env.DB_DATABASE || 'trustlink',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'migrations',
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
