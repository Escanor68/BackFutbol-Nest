import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    // Aquí se validaría el token JWT en un proyecto real
    // Por ahora simulo que es válido para las pruebas
    const token = authHeader.substring(7);
    request.user = { id: 1 }; // Usuario mock

    return true;
  }
}
