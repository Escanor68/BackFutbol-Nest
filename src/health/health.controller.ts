import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExternalJwtAuthGuard } from '../auth/guards/external-jwt-auth.guard';
import { ExternalRolesGuard } from '../auth/guards/external-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check básico',
    description: 'Verifica que el servicio esté funcionando correctamente',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio funcionando correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
        uptime: { type: 'number', example: 3600 },
      },
    },
  })
  check() {
    return this.healthService.check();
  }

  @Get('readiness')
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Verifica que el servicio esté listo para recibir tráfico',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio listo para recibir tráfico',
  })
  @ApiResponse({
    status: 503,
    description: 'Servicio no está listo',
  })
  readiness() {
    return this.healthService.readiness();
  }

  @Get('liveness')
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Verifica que el servicio esté vivo y funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio vivo y funcionando',
  })
  liveness() {
    return this.healthService.liveness();
  }

  @Get('payment-service')
  @UseGuards(ExternalJwtAuthGuard, ExternalRolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Estado del servicio de pagos',
    description: 'Obtiene el estado actual del servicio de pagos',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del servicio de pagos obtenido',
    schema: {
      type: 'object',
      properties: {
        paymentService: { type: 'string', example: 'operational' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  paymentService() {
    return this.healthService.getPaymentServiceStatus();
  }
}
