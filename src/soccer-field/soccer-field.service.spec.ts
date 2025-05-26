import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoccerFieldService } from './soccer-field.service';
import { SoccerField } from './entities/soccer-field.entity';
import { BadRequestException, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateSoccerFieldDto } from './dto/create-soccer-field.dto';

describe('SoccerFieldService', () => {
  let service: SoccerFieldService;
  let repository: Repository<SoccerField>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoccerFieldService,
        {
          provide: getRepositoryToken(SoccerField),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SoccerFieldService>(SoccerFieldService);
    repository = module.get<Repository<SoccerField>>(getRepositoryToken(SoccerField));
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
      await expect(service.createShifts(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      const invalidDto = { ...createDto, availableFrom: '18:00', availableUntil: '09:00' };
      await expect(service.createShifts(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle database errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));
      await expect(service.createShifts(createDto)).rejects.toThrow(BadRequestException);
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
      mockRepository.save.mockResolvedValue({ ...mockField, reservation: 'Active' });

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
      await expect(service.releaseField('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when field is already available', async () => {
      const mockField = {
        id: '1',
        reservation: 'Inactive',
      };
      mockRepository.findOne.mockResolvedValue(mockField);
      await expect(service.releaseField('1')).rejects.toThrow(BadRequestException);
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
      const mockFields = [{ id: '1', fieldName: 'Field 1', latitude: 1, longitude: 1 }];
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
      mockRepository.createQueryBuilder().getMany.mockRejectedValue(new Error('Database error'));
      await expect(service.getNearbyFields(1, 1)).rejects.toThrow();
    });
  });
}); 