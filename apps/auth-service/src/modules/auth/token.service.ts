import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../interfaces/jwt-payload.interface';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(user: UserDocument) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user._id.toString(),
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.jwt.accessExpiration') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.jwt.refreshExpiration') || '7d',
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(refreshToken: string): JwtPayload {
    return this.jwtService.verify(refreshToken, {
      secret: this.configService.get('auth.jwt.secret') || 'your-secret-key',
    });
  }
}
