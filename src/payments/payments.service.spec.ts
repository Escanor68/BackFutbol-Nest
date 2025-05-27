import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepository: Repository<Payment>;
  let bookingRepository: Repository<Booking>;

  const mockBooking = {
    id: 1,
    userId: 1,
    field: {
      id: 1,
      name: 'Test Field',
    },
    totalPrice: 100,
  };

  const mockPayment = {
    id: 'payment-uuid',
    preferenceId: 'pref-123',
    mercadoPagoId: 'mp-123',
    status: 'pending',
    amount: 100,
    currency: 'ARS',
    booking: mockBooking,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        'MERCADOPAGO_ACCESS_TOKEN': 'test-token',
        'FRONTEND_URL': 'http://localhost:3000',
        'BACKEND_URL': 'http://localhost:3001',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            create: jest.fn().mockReturnValue(mockPayment),
            save: jest.fn().mockResolvedValue(mockPayment),
            findOne: jest.fn().mockResolvedValue(mockPayment),
            find: jest.fn().mockResolvedValue([mockPayment]),
          },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockBooking),
            save: jest.fn().mockResolvedValue(mockBooking),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPreference', () => {
    it('should create a payment preference', async () => {
      const result = await service.createPreference(1, 1, 'test@example.com');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('init_point');
      expect(paymentRepository.create).toHaveBeenCalled();
      expect(paymentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when booking not found', async () => {
      jest.spyOn(bookingRepository, 'findOne').mockResolvedValue(null);
      await expect(
        service.createPreference(1, 1, 'test@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const result = await service.getPaymentStatus(1, 'payment-uuid');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('preferenceId');
    });

    it('should throw NotFoundException when payment not found', async () => {
      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue(null);
      await expect(
        service.getPaymentStatus(1, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when unauthorized', async () => {
      const unauthorizedPayment = {
        ...mockPayment,
        booking: { ...mockBooking, userId: 999 },
      };
      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue(unauthorizedPayment);
      await expect(
        service.getPaymentStatus(1, 'payment-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const result = await service.getAllPayments();
      expect(result).toHaveProperty('payments');
      expect(Array.isArray(result.payments)).toBe(true);
      expect(paymentRepository.find).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment webhook', async () => {
      const mockPaymentInfo = {
        status: 'approved',
        preference_id: 'pref-123',
        id: 'mp-123',
      };

      service['mercadopago'] = {
        payment: {
          findById: jest.fn().mockResolvedValue(mockPaymentInfo),
        },
      };

      await service.handleWebhook('payment.created', { id: 'mp-123' });
      expect(paymentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      service['mercadopago'] = {
        payment: {
          findById: jest.fn().mockResolvedValue({ preference_id: 'invalid' }),
        },
      };
      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.handleWebhook('payment.created', { id: 'mp-123' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
}); 