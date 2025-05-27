import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoccerField } from './entities/soccer-field.entity';
import { CreateSoccerFieldDto } from './dto/create-soccer-field.dto';
import { Field } from './entities/field.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class SoccerFieldService {
  constructor(
    @InjectRepository(SoccerField)
    private readonly soccerFieldRepository: Repository<SoccerField>,
    @InjectRepository(Field)
    private fieldRepository: Repository<Field>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async createShifts(createDto: CreateSoccerFieldDto): Promise<void> {
    try {
      this.validateTimeFormat(createDto.availableFrom);
      this.validateTimeFormat(createDto.availableUntil);

      const shifts = this.generateShifts(
        createDto.userField,
        createDto.fieldName,
        createDto.availableFrom,
        createDto.availableUntil,
        createDto.price,
      );

      await Promise.all(shifts.map(shift => this.soccerFieldRepository.save(shift)));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error creating shifts: ${error.message}`);
    }
  }

  async getFieldsByOwner(userField: number): Promise<SoccerField[]> {
    return this.soccerFieldRepository.find({
      where: { owner: userField },
    });
  }

  async reserveField(
    owner: number,
    fieldName: string,
    schedule: string,
    whoReservedId: number,
    whoReservedName: string,
  ): Promise<void> {
    const field = await this.soccerFieldRepository.findOne({
      where: { owner, schedule, fieldName },
    });

    if (!field) {
      throw new NotFoundException(`Field ${fieldName} not found`);
    }

    if (field.reservation === 'Active') {
      throw new ConflictException(`Field ${fieldName} is already reserved`);
    }

    field.whoReservedId = whoReservedId;
    field.whoReservedName = whoReservedName;
    field.reservation = 'Active';

    await this.soccerFieldRepository.save(field);
  }

  async releaseField(id: string): Promise<void> {
    const field = await this.soccerFieldRepository.findOne({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }

    if (field.reservation === 'Inactive') {
      throw new BadRequestException(`Field with ID ${id} is already available`);
    }

    field.whoReservedId = null;
    field.whoReservedName = null;
    field.reservation = 'Inactive';

    await this.soccerFieldRepository.save(field);
  }

  async getNearbyFields(lat: number, lng: number, radiusKm = 20): Promise<SoccerField[]> {
    return this.soccerFieldRepository
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

  private validateTimeFormat(time: string): void {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) {
      throw new BadRequestException('Time must be in HH:mm format');
    }
  }

  private generateShifts(
    owner: number,
    fieldName: string,
    availableFrom: string,
    availableUntil: string,
    price: number,
  ): Partial<SoccerField>[] {
    const shifts: Partial<SoccerField>[] = [];
    const fromTime = new Date(`1970-01-01T${availableFrom}:00`);
    const untilTime = new Date(`1970-01-01T${availableUntil}:00`);

    if (fromTime >= untilTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const maxExceedTime = new Date(untilTime.getTime() + 30 * 60 * 1000);
    let currentTime = fromTime;

    while (currentTime < maxExceedTime) {
      const nextTime = new Date(currentTime.getTime() + 90 * 60 * 1000);

      if (nextTime <= maxExceedTime) {
        shifts.push({
          owner,
          fieldName,
          schedule: `${this.formatTime(currentTime)} a ${this.formatTime(nextTime)}`,
          price: price * 1.1,
          reservation: 'Inactive',
        });
      }

      currentTime = nextTime;
    }

    return shifts;
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
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
    // Using Haversine formula in SQL
    const fields = await this.fieldRepository
      .createQueryBuilder('field')
      .where(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(latitude)))) <= :radius`,
        { lat, lng, radius },
      )
      .getMany();

    return fields;
  }

  async getAvailability(fieldId: number, date: Date) {
    const field = await this.findOne(fieldId);
    const bookings = await this.bookingRepository.find({
      where: {
        field: { id: fieldId },
        date: date,
        status: 'confirmed',
      },
    });

    // Get business hours for the specified day
    const dayOfWeek = date.getDay();
    const businessHours = field.businessHours.find(bh => bh.day === dayOfWeek);
    
    if (!businessHours) {
      return [];
    }

    // Generate all possible time slots
    const timeSlots = this.generateTimeSlots(businessHours.openTime, businessHours.closeTime);
    
    // Filter out booked slots
    return timeSlots.filter(slot => {
      return !bookings.some(booking => 
        (slot.startTime >= booking.startTime && slot.startTime < booking.endTime) ||
        (slot.endTime > booking.startTime && slot.endTime <= booking.endTime)
      );
    });
  }

  private generateTimeSlots(openTime: string, closeTime: string) {
    const slots = [];
    let currentTime = new Date(`2000-01-01T${openTime}`);
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
} 