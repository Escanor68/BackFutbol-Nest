import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { ParseIntPipe } from '@nestjs/common';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(
    @Body()
    createBookingDto: {
      fieldId: number;
      userId: number;
      date: string;
      startTime: string;
      endTime: string;
    },
  ) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  findAll(
    @Query('userId') userId?: number,
    @Query('fieldId') fieldId?: number,
    @Query('date') date?: string,
  ) {
    return this.bookingService.findAll({ userId, fieldId, date });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(id);
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.cancel(id);
  }
}
