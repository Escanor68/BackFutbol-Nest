import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      const user = await this.authService.validateUser(payload.sub);
      if (!user.isActive) {
        throw new UnauthorizedException('Cuenta desactivada');
      }
      return user;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Token inválido');
    }
  }
}
