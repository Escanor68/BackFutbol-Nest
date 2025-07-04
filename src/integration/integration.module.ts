import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ExternalAuthService } from '../common/services/external-auth.service';
import { PaymentIntegrationService } from '../common/services/payment-integration.service';
import { ExternalJwtAuthGuard } from '../auth/guards/external-jwt-auth.guard';
import { ExternalRolesGuard } from '../auth/guards/external-roles.guard';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos
      maxRedirects: 3,
    }),
    ConfigModule,
  ],
  providers: [
    ExternalAuthService,
    PaymentIntegrationService,
    ExternalJwtAuthGuard,
    ExternalRolesGuard,
  ],
  exports: [
    ExternalAuthService,
    PaymentIntegrationService,
    ExternalJwtAuthGuard,
    ExternalRolesGuard,
  ],
})
export class IntegrationModule {}
