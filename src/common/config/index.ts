import 'dotenv/config';
import IConfig from './config.interface';

export default (): IConfig => ({
  port: parseInt(process.env.PORT, 10) ?? 9000,
  client_url: process.env.CLIENT_URL ?? 'http://localhost:3000',
  database: {
    type: process.env.DATABASE_TYPE ?? 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) ?? 5432,
    database: process.env.DATABASE_NAME ?? '100ty',
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'password',
  },
  jwtConfig: {
    secret: process.env.JWT_SECRET ?? '',
    expireIn: process.env.JWT_EXPIRE_IN ?? '30m',
  },
});
