import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Field } from '../soccer-field/entities/field.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: Repository<Booking>;
  let fieldRepository: Repository<Field>;

  const mockField = {
    id: 1,
    name: 'Test Field',
    pricePerHour: 50.00,
  };

  const mockBooking = {
    id: 1,
    field: mockField,
    userId: 1,
    date: new Date('2024-03-20'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    totalPrice: 50.00,
  };

  const createBookingDto = {
    fieldId: 1,
    userId: 1,
    date: '2024-03-20',
    startTime: '10:00',
    endTime: '11:00',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            create: jest.fn().mockReturnValue(mockBooking),
            save: jest.fn().mockResolvedValue(mockBooking),
            findOne: jest.fn().mockResolvedValue(mockBooking),
            find: jest.fn().mockResolvedValue([mockBooking]),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockBooking]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Field),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockField),
          },
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    fieldRepository = module.get<Repository<Field>>(getRepositoryToken(Field));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      const result = await service.create(createBookingDto);
      expect(result).toEqual(mockBooking);
      expect(fieldRepository.findOne).toHaveBeenCalled();
      expect(bookingRepository.create).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when field not found', async () => {
      jest.spyOn(fieldRepository, 'findOne').mockResolvedValue(null);
      await expect(service.create(createBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when time slot is not available', async () => {
      jest.spyOn(bookingRepository, 'find').mockResolvedValue([
        { ...mockBooking, startTime: '10:00', endTime: '11:00' },
      ]);
      await expect(service.create(createBookingDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all bookings', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockBooking]);
    });

    it('should filter bookings by userId', async () => {
      const result = await service.findAll({ userId: 1 });
      expect(result).toEqual([mockBooking]);
    });

    it('should filter bookings by fieldId', async () => {
      const result = await service.findAll({ fieldId: 1 });
      expect(result).toEqual([mockBooking]);
    });

    it('should filter bookings by date', async () => {
      const result = await service.findAll({ date: '2024-03-20' });
      expect(result).toEqual([mockBooking]);
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException when booking not found', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      const cancelledBooking = { ...mockBooking, status: 'cancelled' };
      jest.spyOn(bookingRepository, 'save').mockResolvedValue(cancelledBooking);
      
      const result = await service.cancel(1);
      expect(result.status).toBe('cancelled');
    });

    it('should throw NotFoundException when booking not found', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);
      await expect(service.cancel(999)).rejects.toThrow(NotFoundException);
    });
  });
}); 