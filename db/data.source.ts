import { DataSource, DataSourceOptions } from 'typeorm';

import 'dotenv/config';

export const dataBaseSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) ?? 5432,
  database: process.env.DATABASE_NAME ?? '100ty',
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'password',
  synchronize: false,
  migrations: ['dist/db/migrations/*{.ts,.js}'],
  entities: ['dist/src/common/database/base.entity.js'],
};

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) ?? 5432,
  database: process.env.DATABASE_NAME ?? '100ty',
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'password',
  synchronize: false,
  migrations: ['dist/db/migrations/*{.ts,.js}'],
  entities: ['dist/**/*.entity{.ts,.js}'],
};

export default new DataSource(dataBaseSourceOptions);
