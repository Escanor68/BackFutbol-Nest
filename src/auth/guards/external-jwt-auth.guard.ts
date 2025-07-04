import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ExternalAuthService } from '../../common/services/external-auth.service';

@Injectable()
export class ExternalJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(ExternalJwtAuthGuard.name);

  constructor(private readonly externalAuthService: ExternalAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token de autorización requerido');
    }

    try {
      const user = await this.externalAuthService.validateToken(token);

      if (!this.externalAuthService.isUserActive(user)) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Agregar el usuario al request para uso posterior
      request['user'] = user;

      return true;
    } catch (error) {
      this.logger.error(
        `Error validando token externo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
