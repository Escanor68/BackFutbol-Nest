import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  ExternalAuthService,
  ExternalUser,
} from '../../common/services/external-auth.service';

@Injectable()
export class ExternalRolesGuard implements CanActivate {
  private readonly logger = new Logger(ExternalRolesGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly externalAuthService: ExternalAuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as ExternalUser;

    if (!user) {
      this.logger.error('Usuario no encontrado en request');
      throw new ForbiddenException('Acceso denegado - usuario no autenticado');
    }

    const hasRole = requiredRoles.some((role) =>
      this.externalAuthService.hasRole(user, role),
    );

    if (!hasRole) {
      this.logger.warn(
        `Usuario ${user.id} intentó acceder a recurso que requiere roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Acceso denegado - se requieren los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
