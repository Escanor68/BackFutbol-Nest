import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Field } from './entities/field.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Review } from './entities/review.entity';
import { SpecialHours } from './entities/special-hours.entity';
import { CreateFieldDto } from './dto/create-field.dto';
import { SearchFieldsDto } from './dto/search-fields.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateSpecialHoursDto } from './dto/create-special-hours.dto';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

@Injectable()
export class SoccerFieldService {
  constructor(
    @InjectRepository(Field)
    private readonly fieldRepository: Repository<Field>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(SpecialHours)
    private readonly specialHoursRepository: Repository<SpecialHours>,
  ) {}

  async createField(createFieldDto: CreateFieldDto): Promise<Field> {
    const field = this.fieldRepository.create(createFieldDto);
    return this.fieldRepository.save(field);
  }

  async findAll() {
    return this.fieldRepository.find();
  }

  async findOne(id: number) {
    const field = await this.fieldRepository.findOne({
      where: { id },
      relations: ['bookings'],
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }

    return field;
  }

  async findNearby(lat: number, lng: number, radius: number) {
    const fields = await this.fieldRepository
      .createQueryBuilder('field')
      .where(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(latitude)))) <= :radius`,
        { lat, lng, radius },
      )
      .getMany();

    return fields;
  }

  async getAvailability(fieldId: number, date: Date): Promise<TimeSlot[]> {
    const field = await this.findOne(fieldId);
    const bookings = await this.bookingRepository.find({
      where: {
        field: { id: fieldId },
        date: date,
        status: 'confirmed',
      },
    });

    const dayOfWeek = date.getDay();
    const businessHours = field.businessHours.find(
      (bh) => bh.day === dayOfWeek,
    );

    if (!businessHours) {
      return [];
    }

    const timeSlots = this.generateTimeSlots(
      businessHours.openTime,
      businessHours.closeTime,
    );

    return timeSlots.filter((slot) => {
      return !bookings.some(
        (booking) =>
          (slot.startTime >= booking.startTime &&
            slot.startTime < booking.endTime) ||
          (slot.endTime > booking.startTime && slot.endTime <= booking.endTime),
      );
    });
  }

  private generateTimeSlots(openTime: string, closeTime: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const currentTime = new Date(`2000-01-01T${openTime}`);
    const endTime = new Date(`2000-01-01T${closeTime}`);

    while (currentTime < endTime) {
      const startTime = currentTime.toTimeString().slice(0, 5);
      currentTime.setHours(currentTime.getHours() + 1);
      const endTimeSlot = currentTime.toTimeString().slice(0, 5);

      slots.push({
        startTime,
        endTime: endTimeSlot,
      });
    }

    return slots;
  }

  async searchFields(searchDto: SearchFieldsDto) {
    const query = this.fieldRepository.createQueryBuilder('field');

    if (searchDto.minPrice) {
      query.andWhere('field.pricePerHour >= :minPrice', {
        minPrice: searchDto.minPrice,
      });
    }

    if (searchDto.maxPrice) {
      query.andWhere('field.pricePerHour <= :maxPrice', {
        maxPrice: searchDto.maxPrice,
      });
    }

    if (searchDto.surface) {
      query.andWhere('field.surface = :surface', {
        surface: searchDto.surface,
      });
    }

    if (searchDto.hasLighting !== undefined) {
      query.andWhere('field.hasLighting = :hasLighting', {
        hasLighting: searchDto.hasLighting,
      });
    }

    if (searchDto.isIndoor !== undefined) {
      query.andWhere('field.isIndoor = :isIndoor', {
        isIndoor: searchDto.isIndoor,
      });
    }

    if (searchDto.minRating) {
      query.andWhere('field.averageRating >= :minRating', {
        minRating: searchDto.minRating,
      });
    }

    return query.getMany();
  }

  async createReview(fieldId: number, createReviewDto: CreateReviewDto) {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
    });
    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      field,
    });

    await this.reviewRepository.save(review);

    const reviews = await this.reviewRepository.find({
      where: { field: { id: fieldId } },
    });
    field.reviewCount = reviews.length;
    field.averageRating =
      reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
    await this.fieldRepository.save(field);

    return review;
  }

  async getFieldStatistics(ownerId: number) {
    const fields = await this.fieldRepository.find({
      where: { ownerId },
      relations: ['bookings', 'reviews'],
    });

    return fields.map((field) => ({
      fieldId: field.id,
      fieldName: field.name,
      totalBookings: field.bookings.length,
      averageRating: field.averageRating,
      reviewCount: field.reviewCount,
      revenue: field.bookings.reduce(
        (acc, booking) => acc + booking.totalPrice,
        0,
      ),
    }));
  }

  async createSpecialHours(
    fieldId: number,
    createSpecialHoursDto: CreateSpecialHoursDto,
  ) {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
    });
    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    const specialHours = this.specialHoursRepository.create({
      ...createSpecialHoursDto,
      field,
    });

    return this.specialHoursRepository.save(specialHours);
  }

  async getSpecialHours(fieldId: number, startDate: Date, endDate: Date) {
    return this.specialHoursRepository.find({
      where: {
        field: { id: fieldId },
        date: Between(startDate, endDate),
      },
    });
  }

  async getFieldsByOwner(ownerId: number): Promise<Field[]> {
    return this.fieldRepository.find({
      where: { ownerId },
    });
  }

  async getNearbyFields(
    lat: number,
    lng: number,
    radiusKm = 20,
  ): Promise<Field[]> {
    return this.fieldRepository
      .createQueryBuilder('field')
      .addSelect(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(field.latitude)) *
            cos(radians(field.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(field.latitude))
          )
        )`,
        'distance',
      )
      .having('distance <= :radius', { radius: radiusKm })
      .setParameters({ lat, lng })
      .getMany();
  }
}
