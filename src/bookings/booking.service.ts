import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Field } from '../soccer-field/entities/field.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Field)
    private fieldRepository: Repository<Field>,
  ) {}

  async create(createBookingDto: {
    fieldId: number;
    userId: number;
    date: string;
    startTime: string;
    endTime: string;
  }) {
    const field = await this.fieldRepository.findOne({
      where: { id: createBookingDto.fieldId },
    });

    if (!field) {
      throw new NotFoundException('Field not found');
    }

    // Check if the time slot is available
    const isAvailable = await this.checkAvailability(
      field.id,
      new Date(createBookingDto.date),
      createBookingDto.startTime,
      createBookingDto.endTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('This time slot is not available');
    }

    // Calculate total price
    const hours = this.calculateHours(
      createBookingDto.startTime,
      createBookingDto.endTime,
    );
    const totalPrice = hours * field.pricePerHour;

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      field,
      totalPrice,
      status: 'confirmed',
    });

    return this.bookingRepository.save(booking);
  }

  async findAll(filters?: {
    userId?: number;
    fieldId?: number;
    date?: string;
  }) {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.field', 'field');

    if (filters?.userId) {
      query.andWhere('booking.userId = :userId', { userId: filters.userId });
    }

    if (filters?.fieldId) {
      query.andWhere('field.id = :fieldId', { fieldId: filters.fieldId });
    }

    if (filters?.date) {
      query.andWhere('booking.date = :date', { date: filters.date });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['field'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async cancel(id: number) {
    const booking = await this.findOne(id);
    booking.status = 'cancelled';
    return this.bookingRepository.save(booking);
  }

  private async checkAvailability(
    fieldId: number,
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    const existingBookings = await this.bookingRepository.find({
      where: {
        field: { id: fieldId },
        date: date,
        status: 'confirmed',
      },
    });

    return !existingBookings.some(
      (booking) =>
        (startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime),
    );
  }

  private calculateHours(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }
}
