import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'trustlink',
  password: process.env.DB_PASSWORD || 'trustlink_secret',
  database: process.env.DB_DATABASE || 'trustlink',
  synchronize: false,
  migrationsRun: true,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
}));
