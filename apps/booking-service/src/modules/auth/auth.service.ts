import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class ServiceAuthService {
  private readonly serviceName: string;
  private readonly jwtSecret: string;
  private readonly tokenExpiry: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.serviceName = 'booking-service';
    this.jwtSecret = this.configService.get<string>('booking.jwt.secret');
    this.tokenExpiry = this.configService.get<string>('booking.jwt.serviceExpiry');
  }

  async getServiceToken(): Promise<string> {
    const cacheKey = `${this.serviceName}:service-token`;
    
    // Try to get token from cache
    const cachedToken = await this.cacheManager.get<string>(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }

    // Generate new token
    const token = this.generateToken();
    
    // Cache token with slightly shorter expiry than token itself
    await this.cacheManager.set(cacheKey, token, 3300000); // 55 minutes
    
    return token;
  }

  private generateToken(): string {
    const payload = {
      sub: this.serviceName,
      roles: ['service'],
      service: this.serviceName,
      type: 'service-to-service'
    };
    
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiry });
  }
} 