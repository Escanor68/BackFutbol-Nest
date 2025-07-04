import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController, WebhookController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Field } from '../soccer-field/entities/field.entity';
import { SpecialHours } from '../soccer-field/entities/special-hours.entity';
import { PricingService } from '../common/services/pricing.service';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Field, SpecialHours]),
    IntegrationModule,
  ],
  controllers: [BookingController, WebhookController],
  providers: [BookingService, PricingService],
  exports: [BookingService],
})
export class BookingsModule {}
