import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  uri: string;
}

export interface RedisConfig {
  uri: string;
}

export interface JwtConfig {
  secret: string;
  serviceExpiry: string;
}

export interface ServiceConfig {
  concertServiceUrl: string;
  authServiceUrl: string;
  requestTimeout: number;
}

export interface BookingConfig {
  port: number;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  service: ServiceConfig;
}

const configuration = (): BookingConfig => ({
  port: parseInt(process.env.PORT, 10) || 3003,
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/bookings',
  },
  redis: {
    uri: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    serviceExpiry: process.env.JWT_SERVICE_EXPIRY || '1h',
  },
  service: {
    concertServiceUrl: process.env.CONCERT_SERVICE_URL || 'http://localhost:3002/api/v1',
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api/v1',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '5000', 10),
  },
});

export default registerAs('booking', configuration); 