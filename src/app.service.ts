import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🏟️ TurnosYa Backend - API para gestión de canchas de fútbol';
  }
}
