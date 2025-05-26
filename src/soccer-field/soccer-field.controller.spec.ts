import { Test, TestingModule } from '@nestjs/testing';
import { SoccerFieldController } from './soccer-field.controller';
import { SoccerFieldService } from './soccer-field.service';
import { CreateSoccerFieldDto } from './dto/create-soccer-field.dto';
import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';

describe('SoccerFieldController', () => {
  let controller: SoccerFieldController;
  let service: SoccerFieldService;

  const mockSoccerFieldService = {
    createShifts: jest.fn(),
    getFieldsByOwner: jest.fn(),
    reserveField: jest.fn(),
    releaseField: jest.fn(),
    getNearbyFields: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoccerFieldController],
      providers: [
        {
          provide: SoccerFieldService,
          useValue: mockSoccerFieldService,
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
}); 