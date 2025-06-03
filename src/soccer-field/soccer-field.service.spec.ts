import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoccerFieldService } from './soccer-field.service';
import { SoccerField } from './entities/soccer-field.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateSoccerFieldDto } from './dto/create-soccer-field.dto';
import { Field } from './entities/field.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Review } from './entities/review.entity';
import { SpecialHours } from './entities/special-hours.entity';

describe('SoccerFieldService', () => {
  let service: SoccerFieldService;
  let repository: Repository<SoccerField>;
  let fieldRepository: Repository<Field>;
  let bookingRepository: Repository<Booking>;
  let reviewRepository: Repository<Review>;
  let specialHoursRepository: Repository<SpecialHours>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockField = {
    id: 1,
    name: 'Test Field',
    address: 'Test Address',
    latitude: 40.7128,
    longitude: -74.006,
    pricePerHour: 50.0,
    businessHours: [{ day: 1, openTime: '09:00', closeTime: '22:00' }],
    description: 'Test Description',
    imageUrl: 'test.jpg',
    surface: 'grass',
    hasLighting: true,
    isIndoor: false,
    amenities: ['parking', 'bathroom'],
    maxPlayers: 22,
    rules: ['no smoking', 'proper footwear required'],
    cancellationPolicy: '24 hours advance notice required',
    averageRating: 4.5,
    reviewCount: 2,
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    bookings: [],
    reviews: [],
    specialHours: [],
  };

  const mockBooking = {
    id: 1,
    field: mockField,
    date: new Date('2024-03-20'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoccerFieldService,
        {
          provide: getRepositoryToken(SoccerField),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Field),
          useValue: {
            find: jest.fn().mockResolvedValue([mockField]),
            findOne: jest.fn().mockResolvedValue(mockField),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockField]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            find: jest.fn().mockResolvedValue([mockBooking]),
          },
        },
        {
          provide: getRepositoryToken(Review),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SpecialHours),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SoccerFieldService>(SoccerFieldService);
    repository = module.get<Repository<SoccerField>>(
      getRepositoryToken(SoccerField),
    );
    fieldRepository = module.get<Repository<Field>>(getRepositoryToken(Field));
    bookingRepository = module.get<Repository<Booking>>(
      getRepositoryToken(Booking),
    );
    reviewRepository = module.get<Repository<Review>>(
      getRepositoryToken(Review),
    );
    specialHoursRepository = module.get<Repository<SpecialHours>>(
      getRepositoryToken(SpecialHours),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createShifts', () => {
    const createDto: CreateSoccerFieldDto = {
      userField: 1,
      fieldName: 'Field 1',
      availableFrom: '09:00',
      availableUntil: '18:00',
      price: 100,
    };

    it('should create shifts successfully', async () => {
      await service.createShifts(createDto);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create correct number of shifts with correct time intervals', async () => {
      await service.createShifts(createDto);
      const saveCallArgs = mockRepository.save.mock.calls.flat();

      // Verificar que los turnos son de 1:30 horas
      saveCallArgs.forEach((shift) => {
        const [startTime, endTime] = shift.schedule.split(' a ');
        const start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);
        const diffInMinutes = (end.getTime() - start.getTime()) / 1000 / 60;
        expect(diffInMinutes).toBe(90); // 1:30 horas = 90 minutos
      });
    });

    it('should apply 10% price increase to each shift', async () => {
      await service.createShifts(createDto);
      const saveCallArgs = mockRepository.save.mock.calls.flat();

      saveCallArgs.forEach((shift) => {
        expect(shift.price).toBe(createDto.price * 1.1);
      });
    });

    it('should throw BadRequestException for invalid time format', async () => {
      const invalidDto = { ...createDto, availableFrom: '9:00' };
      await expect(service.createShifts(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      const invalidDto = {
        ...createDto,
        availableFrom: '18:00',
        availableUntil: '09:00',
      };
      await expect(service.createShifts(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle database errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));
      await expect(service.createShifts(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getFieldsByOwner', () => {
    it('should return fields for a given owner', async () => {
      const mockFields = [{ id: '1', fieldName: 'Field 1' }];
      mockRepository.find.mockResolvedValue(mockFields);

      const result = await service.getFieldsByOwner(1);
      expect(result).toEqual(mockFields);
      expect(repository.find).toHaveBeenCalledWith({ where: { owner: 1 } });
    });

    it('should return empty array when no fields found', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.getFieldsByOwner(1);
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));
      await expect(service.getFieldsByOwner(1)).rejects.toThrow();
    });
  });

  describe('reserveField', () => {
    const reserveData = {
      owner: 1,
      fieldName: 'Field 1',
      schedule: '09:00 a 10:30',
      whoReservedId: 2,
      whoReservedName: 'John Doe',
    };

    it('should reserve a field successfully', async () => {
      const mockField = {
        ...reserveData,
        id: '1',
        reservation: 'Inactive',
      };
      mockRepository.findOne.mockResolvedValue(mockField);
      mockRepository.save.mockResolvedValue({
        ...mockField,
        reservation: 'Active',
      });

      await service.reserveField(
        reserveData.owner,
        reserveData.fieldName,
        reserveData.schedule,
        reserveData.whoReservedId,
        reserveData.whoReservedName,
      );

      expect(repository.save).toHaveBeenCalledWith({
        ...mockField,
        reservation: 'Active',
        whoReservedId: reserveData.whoReservedId,
        whoReservedName: reserveData.whoReservedName,
      });
    });

    it('should throw NotFoundException when field does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reserveField(
          reserveData.owner,
          reserveData.fieldName,
          reserveData.schedule,
          reserveData.whoReservedId,
          reserveData.whoReservedName,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when field is already reserved', async () => {
      const mockField = {
        ...reserveData,
        id: '1',
        reservation: 'Active',
      };
      mockRepository.findOne.mockResolvedValue(mockField);

      await expect(
        service.reserveField(
          reserveData.owner,
          reserveData.fieldName,
          reserveData.schedule,
          reserveData.whoReservedId,
          reserveData.whoReservedName,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle database errors during save', async () => {
      const mockField = {
        ...reserveData,
        id: '1',
        reservation: 'Inactive',
      };
      mockRepository.findOne.mockResolvedValue(mockField);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.reserveField(
          reserveData.owner,
          reserveData.fieldName,
          reserveData.schedule,
          reserveData.whoReservedId,
          reserveData.whoReservedName,
        ),
      ).rejects.toThrow();
    });
  });

  describe('releaseField', () => {
    it('should release a field successfully', async () => {
      const mockField = {
        id: '1',
        reservation: 'Active',
        whoReservedId: 1,
        whoReservedName: 'John Doe',
      };
      mockRepository.findOne.mockResolvedValue(mockField);

      await service.releaseField('1');

      expect(repository.save).toHaveBeenCalledWith({
        ...mockField,
        reservation: 'Inactive',
        whoReservedId: null,
        whoReservedName: null,
      });
    });

    it('should throw NotFoundException when field does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.releaseField('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when field is already available', async () => {
      const mockField = {
        id: '1',
        reservation: 'Inactive',
      };
      mockRepository.findOne.mockResolvedValue(mockField);
      await expect(service.releaseField('1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle database errors during save', async () => {
      const mockField = {
        id: '1',
        reservation: 'Active',
      };
      mockRepository.findOne.mockResolvedValue(mockField);
      mockRepository.save.mockRejectedValue(new Error('Database error'));
      await expect(service.releaseField('1')).rejects.toThrow();
    });
  });

  describe('getNearbyFields', () => {
    it('should return nearby fields within default radius', async () => {
      const mockFields = [
        { id: '1', fieldName: 'Field 1', latitude: 1, longitude: 1 },
        { id: '2', fieldName: 'Field 2', latitude: 1.1, longitude: 1.1 },
      ];
      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockFields);

      const result = await service.getNearbyFields(1, 1);
      expect(result).toEqual(mockFields);
    });

    it('should return nearby fields with custom radius', async () => {
      const mockFields = [
        { id: '1', fieldName: 'Field 1', latitude: 1, longitude: 1 },
      ];
      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockFields);

      const result = await service.getNearbyFields(1, 1, 5);
      expect(result).toEqual(mockFields);
    });

    it('should return empty array when no fields found', async () => {
      mockRepository.createQueryBuilder().getMany.mockResolvedValue([]);
      const result = await service.getNearbyFields(1, 1);
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockRepository
        .createQueryBuilder()
        .getMany.mockRejectedValue(new Error('Database error'));
      await expect(service.getNearbyFields(1, 1)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return an array of fields', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockField]);
      expect(fieldRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single field', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockField);
      expect(fieldRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['bookings'],
      });
    });

    it('should throw NotFoundException when field not found', async () => {
      jest.spyOn(fieldRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findNearby', () => {
    it('should return nearby fields', async () => {
      const result = await service.findNearby(40.7128, -74.006, 10);
      expect(result).toEqual([mockField]);
    });
  });

  describe('getAvailability', () => {
    it('should return available time slots', async () => {
      const date = new Date('2024-03-20');
      const result = await service.getAvailability(1, date);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no business hours for day', async () => {
      const date = new Date('2024-03-24'); // Sunday
      jest.spyOn(service as any, 'findOne').mockResolvedValue({
        ...mockField,
        businessHours: [{ day: 1, openTime: '09:00', closeTime: '22:00' }],
      });
      const result = await service.getAvailability(1, date);
      expect(result).toEqual([]);
    });
  });

  describe('searchFields', () => {
    it('should return fields based on search criteria', async () => {
      const searchDto = {
        minPrice: 50,
        maxPrice: 150,
        surface: 'grass',
        hasLighting: true,
      };

      const result = await service.searchFields(searchDto);
      expect(result).toEqual([mockField]);
    });
  });

  describe('createReview', () => {
    it('should create a review and update field ratings', async () => {
      const createReviewDto = {
        userId: 1,
        userName: 'Test User',
        rating: 5,
        comment: 'Great field!',
      };

      jest.spyOn(reviewRepository, 'create').mockReturnValue({
        ...createReviewDto,
        id: '1',
        field: mockField,
        createdAt: new Date(),
      } as Review);

      jest
        .spyOn(reviewRepository, 'find')
        .mockResolvedValue([{ rating: 4 }, { rating: 5 }] as Review[]);

      const result = await service.createReview(1, createReviewDto);
      expect(result).toBeDefined();
      expect(fieldRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent field', async () => {
      jest.spyOn(fieldRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createReview(999, {
          userId: 1,
          userName: 'Test User',
          rating: 5,
          comment: 'Great field!',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFieldStatistics', () => {
    it('should return statistics for owner fields', async () => {
      const mockFieldWithStats = {
        ...mockField,
        bookings: [{ totalPrice: 100 } as any, { totalPrice: 150 } as any],
      };

      jest
        .spyOn(fieldRepository, 'find')
        .mockResolvedValue([mockFieldWithStats as any]);

      const result = await service.getFieldStatistics(1);
      expect(result).toBeDefined();
      expect(result[0].totalBookings).toBe(2);
      expect(result[0].revenue).toBe(250);
    });
  });

  describe('special hours', () => {
    it('should create special hours for a field', async () => {
      const createSpecialHoursDto = {
        date: new Date(),
        isClosed: true,
        reason: 'Maintenance',
      };

      jest.spyOn(specialHoursRepository, 'create').mockReturnValue({
        ...createSpecialHoursDto,
        id: 1,
        field: mockField,
      } as SpecialHours);

      const result = await service.createSpecialHours(1, createSpecialHoursDto);
      expect(result).toBeDefined();
      expect(specialHoursRepository.save).toHaveBeenCalled();
    });

    it('should get special hours for a date range', async () => {
      const startDate = new Date();
      const endDate = new Date();

      jest.spyOn(specialHoursRepository, 'find').mockResolvedValue([
        {
          id: 1,
          date: new Date(),
          isClosed: true,
          reason: 'Maintenance',
        },
      ] as SpecialHours[]);

      const result = await service.getSpecialHours(1, startDate, endDate);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });
});
