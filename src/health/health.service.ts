import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaymentIntegrationService } from '../common/services/payment-integration.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private paymentIntegrationService: PaymentIntegrationService,
  ) {}

  async check() {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    try {
      // Verificar conexión a base de datos
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp,
        uptime,
        database: 'connected',
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'error',
        timestamp,
        uptime,
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async readiness() {
    try {
      // Verificar que la base de datos esté lista
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        message: 'Service is ready to receive traffic',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      return {
        status: 'error',
        message: 'Service is not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  liveness() {
    return {
      status: 'ok',
      message: 'Service is alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getPaymentServiceStatus() {
    try {
      return {
        paymentService: 'operational',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting payment service status:', error);
      return {
        error: 'Failed to get payment service status',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
