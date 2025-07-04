import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

export interface ExternalUser {
  id: number;
  email: string;
  role: 'PLAYER' | 'FIELD_OWNER' | 'ADMIN';
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthResponse {
  user: ExternalUser;
}

interface UserResponse {
  id: number;
  email: string;
  role: 'PLAYER' | 'FIELD_OWNER' | 'ADMIN';
  firstName: string;
  lastName: string;
  isActive: boolean;
}

@Injectable()
export class ExternalAuthService {
  private readonly logger = new Logger(ExternalAuthService.name);
  private readonly backUPyUCUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.backUPyUCUrl =
      this.configService.get<string>('BACK_UPYUC_URL') ||
      'https://backupyuc.example.com';
  }

  /**
   * Valida un token JWT de BackUPyUC
   */
  async validateToken(token: string): Promise<ExternalUser> {
    try {
      // Verificar el token con BackUPyUC
      const response = await firstValueFrom(
        this.httpService.get<AuthResponse>(
          `${this.backUPyUCUrl}/api/v1/auth/validate`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );

      if (response.status !== 200 || !response.data?.user) {
        throw new UnauthorizedException('Token inválido');
      }

      return response.data.user;
    } catch (error) {
      this.logger.error(
        `Error validando token: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );

      // Fallback: intentar validar localmente si tenemos la clave pública
      try {
        const payload = this.jwtService.verify(token) as unknown as JwtPayload;
        return {
          id: payload.sub,
          email: payload.email,
          role: payload.role as 'PLAYER' | 'FIELD_OWNER' | 'ADMIN',
          firstName: '', // No disponible en el token
          lastName: '', // No disponible en el token
          isActive: true, // Asumimos activo si el token es válido
        };
      } catch {
        throw new UnauthorizedException('Token inválido o expirado');
      }
    }
  }

  /**
   * Obtiene información completa del usuario desde BackUPyUC
   */
  async getUserInfo(userId: number, token: string): Promise<ExternalUser> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<UserResponse>(
          `${this.backUPyUCUrl}/api/v1/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );

      if (response.status !== 200 || !response.data) {
        throw new UnauthorizedException(
          'No se pudo obtener información del usuario',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error obteniendo información del usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new UnauthorizedException(
        'No se pudo obtener información del usuario',
      );
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(user: ExternalUser, requiredRole: string): boolean {
    return user.role === requiredRole || user.role === 'ADMIN';
  }

  /**
   * Verifica si el usuario está activo
   */
  isUserActive(user: ExternalUser): boolean {
    return user.isActive;
  }
}
