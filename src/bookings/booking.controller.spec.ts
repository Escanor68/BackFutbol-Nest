import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBooking = {
    id: 1,
    field: {
      id: 1,
      name: 'Test Field',
    },
    userId: 1,
    date: new Date('2024-03-20'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    totalPrice: 50.0,
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
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockBooking),
            findAll: jest.fn().mockResolvedValue([mockBooking]),
            findOne: jest.fn().mockResolvedValue(mockBooking),
            cancel: jest
              .fn()
              .mockResolvedValue({ ...mockBooking, status: 'cancelled' }),
          },
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const result = await controller.create(createBookingDto);
      expect(result).toEqual(mockBooking);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
    });
  });

  describe('findAll', () => {
    it('should return all bookings', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockBooking]);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should filter bookings by query parameters', async () => {
      const result = await controller.findAll(1, 1, '2024-03-20');
      expect(result).toEqual([mockBooking]);
      expect(service.findAll).toHaveBeenCalledWith({
        userId: 1,
        fieldId: 1,
        date: '2024-03-20',
      });
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual(mockBooking);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      const result = await controller.cancel(1);
      expect(result.status).toBe('cancelled');
      expect(service.cancel).toHaveBeenCalledWith(1);
    });
  });
});
