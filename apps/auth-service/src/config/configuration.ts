import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  uri: string;
}

export interface JwtConfig {
  secret: string;
  accessExpiration: string;
  refreshExpiration: string;
}

export interface AuthConfig {
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

const configuration = (): AuthConfig => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/auth',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
});

export default registerAs('auth', configuration);
