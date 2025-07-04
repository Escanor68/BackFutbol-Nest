import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  externalReference: string;
  amount: number;
  currency: string;
}

export interface PaymentWebhookData {
  id: string;
  status: string;
  externalReference: string;
  amount: number;
  currency: string;
  [key: string]: unknown;
}

@Injectable()
export class PaymentIntegrationService {
  private readonly logger = new Logger(PaymentIntegrationService.name);
  private readonly backMPUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.backMPUrl =
      this.configService.get<string>('BACK_MP_URL') ||
      'https://backmp.example.com';
  }

  /**
   * Verifica el estado de un pago
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      this.logger.log(`Verificando estado del pago ${paymentId}`);

      // En una implementación real, haríamos una llamada HTTP a BackMP
      // Por ahora simulamos una respuesta
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        id: paymentId,
        status: 'approved' as const,
        externalReference: `booking_${Date.now()}`,
        amount: 1000,
        currency: 'ARS',
      };
    } catch (error) {
      this.logger.error(
        `Error verificando estado del pago: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw new BadRequestException('Error verificando estado del pago');
    }
  }

  /**
   * Procesa un webhook de pago desde BackMP
   */
  processPaymentWebhook(webhookData: PaymentWebhookData): void {
    try {
      this.logger.log(
        `Procesando webhook de pago: ${JSON.stringify(webhookData)}`,
      );

      // Validar datos básicos del webhook
      if (
        !webhookData.id ||
        !webhookData.status ||
        !webhookData.externalReference
      ) {
        throw new BadRequestException('Datos de webhook incompletos');
      }

      // Aquí procesaríamos el webhook y actualizaríamos el estado de la reserva
      // Por ahora solo logueamos
      this.logger.log(
        `Webhook procesado para pago ${webhookData.id} con estado ${webhookData.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Error procesando webhook: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      throw error;
    }
  }

  /**
   * Valida que un pago esté aprobado antes de confirmar una reserva
   */
  async validatePaymentForBooking(
    bookingId: number,
    paymentId: string,
  ): Promise<boolean> {
    try {
      const paymentStatus = await this.getPaymentStatus(paymentId);

      if (paymentStatus.status !== 'approved') {
        this.logger.warn(
          `Pago ${paymentId} no está aprobado. Estado: ${paymentStatus.status}`,
        );
        return false;
      }

      // Verificar que el externalReference coincida con el bookingId
      const expectedReference = `booking_${bookingId}`;
      if (paymentStatus.externalReference !== expectedReference) {
        this.logger.warn(
          `Referencia externa no coincide: ${paymentStatus.externalReference} vs ${expectedReference}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error validando pago: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      return false;
    }
  }
}
