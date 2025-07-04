import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoccerFieldController } from './soccer-field.controller';
import { SoccerFieldService } from './soccer-field.service';
import { Field } from './entities/field.entity';
import { Review } from './entities/review.entity';
import { SpecialHours } from './entities/special-hours.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Field, Review, SpecialHours, Booking]),
    IntegrationModule,
  ],
  controllers: [SoccerFieldController],
  providers: [SoccerFieldService],
  exports: [SoccerFieldService],
})
export class SoccerFieldModule {}
