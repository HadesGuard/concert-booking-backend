import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@app/common';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(user: UserDocument) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user._id,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.jwt.accessExpiration'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.jwt.refreshExpiration'),
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(refreshToken: string): JwtPayload {
    return this.jwtService.verify(refreshToken, {
      secret: this.configService.get('auth.jwt.secret'),
    });
  }
}
