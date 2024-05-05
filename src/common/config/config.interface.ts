export interface DatabaseConfig {
  type: any;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface JWTConfig {
  secret: string;
  expireIn: string;
}

interface IConfig {
  port: number;
  client_url: string;
  database: DatabaseConfig;
  jwtConfig: JWTConfig;
}

export default IConfig;
