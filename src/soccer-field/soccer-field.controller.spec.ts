import { Test, TestingModule } from '@nestjs/testing';
import { SoccerFieldController } from './soccer-field.controller';
import { SoccerFieldService } from './soccer-field.service';
import { CreateSoccerFieldDto } from './dto/create-soccer-field.dto';
import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { SearchFieldsDto } from './dto/search-fields.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateSpecialHoursDto } from './dto/create-special-hours.dto';

describe('SoccerFieldController', () => {
  let controller: SoccerFieldController;
  let service: SoccerFieldService;

  const mockSoccerFieldService = {
    createShifts: jest.fn(),
    getFieldsByOwner: jest.fn(),
    reserveField: jest.fn(),
    releaseField: jest.fn(),
    getNearbyFields: jest.fn(),
    searchFields: jest.fn(),
    createReview: jest.fn(),
    getFieldStatistics: jest.fn(),
    createSpecialHours: jest.fn(),
    getSpecialHours: jest.fn(),
  };

  const mockField = {
    id: 1,
    name: 'Test Field',
    address: 'Test Address',
    latitude: 40.7128,
    longitude: -74.0060,
    pricePerHour: 50.00,
    businessHours: [
      { day: 1, openTime: '09:00', closeTime: '22:00' }
    ],
    surface: 'grass',
    hasLighting: true,
    isIndoor: false,
    averageRating: 4.5,
    reviewCount: 2,
  };

  const mockAvailability = [
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '12:00' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoccerFieldController],
      providers: [
        {
          provide: SoccerFieldService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockField]),
            findOne: jest.fn().mockResolvedValue(mockField),
            findNearby: jest.fn().mockResolvedValue([mockField]),
            getAvailability: jest.fn().mockResolvedValue(mockAvailability),
            searchFields: jest.fn().mockResolvedValue([mockField]),
            getFieldStatistics: jest.fn().mockResolvedValue([{
              fieldId: 1,
              fieldName: 'Test Field',
              totalBookings: 10,
              averageRating: 4.5,
              reviewCount: 5,
              revenue: 1000,
            }]),
            createSpecialHours: jest.fn().mockResolvedValue({
              id: 1,
              date: new Date(),
              isClosed: true,
            }),
            getSpecialHours: jest.fn().mockResolvedValue([{
              id: 1,
              date: new Date(),
              isClosed: true,
            }]),
          },
        },
      ],
    }).compile();

    controller = module.get<SoccerFieldController>(SoccerFieldController);
    service = module.get<SoccerFieldService>(SoccerFieldService);
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
      await controller.createShifts(createDto);
      expect(service.createShifts).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when service throws', async () => {
      mockSoccerFieldService.createShifts.mockRejectedValue(new BadRequestException());
      await expect(controller.createShifts(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate DTO fields', async () => {
      const validationPipe = new ValidationPipe();
      const invalidDto = {
        userField: 'not a number',
        fieldName: '',
        availableFrom: 'invalid time',
        availableUntil: 'invalid time',
        price: 'not a number',
      };

      await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: CreateSoccerFieldDto }))
        .rejects.toThrow();
    });
  });

  describe('getFieldsByOwner', () => {
    it('should return fields for a given owner', async () => {
      const mockFields = [{ id: '1', fieldName: 'Field 1' }];
      mockSoccerFieldService.getFieldsByOwner.mockResolvedValue(mockFields);

      const result = await controller.getFieldsByOwner(1);
      expect(result).toEqual(mockFields);
      expect(service.getFieldsByOwner).toHaveBeenCalledWith(1);
    });

    it('should handle empty response', async () => {
      mockSoccerFieldService.getFieldsByOwner.mockResolvedValue([]);
      const result = await controller.getFieldsByOwner(1);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockSoccerFieldService.getFieldsByOwner.mockRejectedValue(new Error('Service error'));
      await expect(controller.getFieldsByOwner(1)).rejects.toThrow();
    });
  });

  describe('reserveField', () => {
    const reserveDto = {
      owner: 1,
      fieldName: 'Field 1',
      schedule: '09:00 a 10:30',
      whoReservedId: 2,
      whoReservedName: 'John Doe',
    };

    it('should reserve a field successfully', async () => {
      await controller.reserveField(reserveDto);
      expect(service.reserveField).toHaveBeenCalledWith(
        reserveDto.owner,
        reserveDto.fieldName,
        reserveDto.schedule,
        reserveDto.whoReservedId,
        reserveDto.whoReservedName,
      );
    });

    it('should throw NotFoundException when service throws', async () => {
      mockSoccerFieldService.reserveField.mockRejectedValue(new NotFoundException());
      await expect(controller.reserveField(reserveDto)).rejects.toThrow(NotFoundException);
    });

    it('should validate all required fields', async () => {
      const validationPipe = new ValidationPipe();
      const invalidDto = {
        owner: 1,
        // missing required fields
      };

      await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: CreateSoccerFieldDto }))
        .rejects.toThrow();
    });
  });

  describe('releaseField', () => {
    it('should release a field successfully', async () => {
      await controller.releaseField('1');
      expect(service.releaseField).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when service throws', async () => {
      mockSoccerFieldService.releaseField.mockRejectedValue(new NotFoundException());
      await expect(controller.releaseField('1')).rejects.toThrow(NotFoundException);
    });

    it('should validate field id', async () => {
      await expect(controller.releaseField('')).rejects.toThrow();
    });
  });

  describe('getNearbyFields', () => {
    it('should return nearby fields', async () => {
      const mockFields = [
        { id: '1', fieldName: 'Field 1', latitude: 1, longitude: 1 },
        { id: '2', fieldName: 'Field 2', latitude: 1.1, longitude: 1.1 },
      ];
      mockSoccerFieldService.getNearbyFields.mockResolvedValue(mockFields);

      const result = await controller.getNearbyFields(1, 1, 10);
      expect(result).toEqual(mockFields);
      expect(service.getNearbyFields).toHaveBeenCalledWith(1, 1, 10);
    });

    it('should use default radius when not provided', async () => {
      await controller.getNearbyFields(1, 1);
      expect(service.getNearbyFields).toHaveBeenCalledWith(1, 1, undefined);
    });

    it('should validate coordinates', async () => {
      await expect(controller.getNearbyFields(null, null)).rejects.toThrow();
    });

    it('should handle invalid radius', async () => {
      await expect(controller.getNearbyFields(1, 1, -1)).rejects.toThrow();
    });

    it('should handle service errors', async () => {
      mockSoccerFieldService.getNearbyFields.mockRejectedValue(new Error('Service error'));
      await expect(controller.getNearbyFields(1, 1)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return an array of fields', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockField]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single field', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual(mockField);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findNearby', () => {
    it('should return nearby fields', async () => {
      const result = await controller.findNearby(40.7128, -74.0060, 10);
      expect(result).toEqual([mockField]);
      expect(service.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 10);
    });
  });

  describe('getAvailability', () => {
    it('should return available time slots', async () => {
      const result = await controller.getAvailability(1, '2024-03-20');
      expect(result).toEqual(mockAvailability);
      expect(service.getAvailability).toHaveBeenCalledWith(1, expect.any(Date));
    });
  });

  describe('searchFields', () => {
    it('should return fields based on search criteria', async () => {
      const searchDto: SearchFieldsDto = {
        minPrice: 50,
        maxPrice: 150,
        surface: 'grass',
        hasLighting: true,
      };

      const result = await controller.searchFields(searchDto);
      expect(result).toEqual([mockField]);
      expect(service.searchFields).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('createReview', () => {
    it('should create a review for a field', async () => {
      const createReviewDto: CreateReviewDto = {
        userId: 1,
        userName: 'Test User',
        rating: 5,
        comment: 'Great field!',
      };

      const result = await controller.createReview(1, createReviewDto);
      expect(result).toBeDefined();
      expect(service.createReview).toHaveBeenCalledWith(1, createReviewDto);
    });
  });

  describe('getFieldStatistics', () => {
    it('should return statistics for owner fields', async () => {
      const result = await controller.getFieldStatistics(1);
      expect(result).toBeDefined();
      expect(service.getFieldStatistics).toHaveBeenCalledWith(1);
      expect(result[0].totalBookings).toBe(10);
    });
  });

  describe('special hours', () => {
    it('should create special hours for a field', async () => {
      const createSpecialHoursDto: CreateSpecialHoursDto = {
        date: new Date(),
        isClosed: true,
        reason: 'Maintenance',
      };

      const result = await controller.createSpecialHours(1, createSpecialHoursDto);
      expect(result).toBeDefined();
      expect(service.createSpecialHours).toHaveBeenCalledWith(1, createSpecialHoursDto);
    });

    it('should get special hours for a date range', async () => {
      const startDate = new Date();
      const endDate = new Date();

      const result = await controller.getSpecialHours(1, startDate, endDate);
      expect(result).toBeDefined();
      expect(service.getSpecialHours).toHaveBeenCalledWith(1, startDate, endDate);
    });
  });
}); 