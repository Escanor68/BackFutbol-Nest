import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Field } from '../soccer-field/entities/field.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Field])],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingsModule {}
