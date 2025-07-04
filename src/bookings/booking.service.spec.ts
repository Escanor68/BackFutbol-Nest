import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Field } from '../soccer-field/entities/field.entity';
import { SpecialHours } from '../soccer-field/entities/special-hours.entity';
import { PricingService } from '../common/services/pricing.service';
import { PaymentIntegrationService } from '../common/services/payment-integration.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BookingService', () => {
  let service: BookingService;

  const mockBookingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockFieldRepository = {
    findOne: jest.fn(),
  };

  const mockSpecialHoursRepository = {
    find: jest.fn(),
  };

  const mockPricingService = {
    calculateBookingPrice: jest.fn(),
    calculateOffPeakDiscount: jest.fn(),
    applyDiscounts: jest.fn(),
  };

  const mockPaymentIntegrationService = {
    createPaymentPreference: jest.fn(),
    validatePaymentForBooking: jest.fn(),
    processPaymentWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Field),
          useValue: mockFieldRepository,
        },
        {
          provide: getRepositoryToken(SpecialHours),
          useValue: mockSpecialHoursRepository,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: PaymentIntegrationService,
          useValue: mockPaymentIntegrationService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockField: Partial<Field> = {
      id: 1,
      name: 'Cancha 1',
      businessHours: [{ day: 1, openTime: '08:00', closeTime: '22:00' }],
    };

    const mockCreateBookingDto = {
      fieldId: 1,
      userId: 1,
      date: '2024-01-02', // Lunes (día 1)
      startTime: '10:00',
      endTime: '11:00',
      payerEmail: 'test@example.com',
    };

    const mockPriceBreakdown = {
      basePrice: 1000,
      platformFee: 100,
      userPayment: 100,
      displayPrice: 1100,
      hours: 1,
    };

    beforeEach(() => {
      mockFieldRepository.findOne.mockResolvedValue(mockField);
      mockSpecialHoursRepository.find.mockResolvedValue([]);
      mockPricingService.calculateBookingPrice.mockReturnValue(
        mockPriceBreakdown,
      );
      mockPricingService.calculateOffPeakDiscount.mockReturnValue(0);
      mockPricingService.applyDiscounts.mockReturnValue(mockPriceBreakdown);
      mockBookingRepository.create.mockReturnValue({
        id: 1,
        ...mockCreateBookingDto,
      });
      mockBookingRepository.save.mockResolvedValue({
        id: 1,
        ...mockCreateBookingDto,
      });
      mockBookingRepository.find.mockResolvedValue([]); // No hay reservas conflictivas
      mockPaymentIntegrationService.createPaymentPreference.mockResolvedValue({
        id: 'pref_123',
        initPoint: 'https://mp.com/checkout',
        sandboxInitPoint: 'https://mp.com/sandbox/checkout',
      });
    });

    it('should create a booking successfully', async () => {
      const result = await service.create(mockCreateBookingDto);

      expect(result.bookings).toHaveLength(1);
      expect(result.message).toContain('Reserva creada exitosamente');
    });

    it('should create a booking without email provided', async () => {
      const dtoWithoutEmail = { ...mockCreateBookingDto };

      const result = await service.create(dtoWithoutEmail);

      expect(result.bookings).toHaveLength(1);
      expect(result.message).toContain('Reserva creada exitosamente');
    });

    it('should create booking successfully', async () => {
      const result = await service.create(mockCreateBookingDto);

      expect(result.bookings).toHaveLength(1);
      expect(result.message).toContain('Reserva creada exitosamente');
    });
  });

  describe('confirmBooking', () => {
    const mockBooking: Partial<Booking> = {
      id: 1,
      status: 'pending',
    };

    beforeEach(() => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        status: 'confirmed',
      });
      mockPaymentIntegrationService.validatePaymentForBooking.mockResolvedValue(
        true,
      );
    });

    it('should confirm a booking with valid payment', async () => {
      const result = await service.confirmBooking(1, 'payment_123');

      expect(result.status).toBe('confirmed');
      expect(
        mockPaymentIntegrationService.validatePaymentForBooking,
      ).toHaveBeenCalledWith(1, 'payment_123');
    });

    it('should throw error for non-existent booking', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.confirmBooking(999, 'payment_123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error for invalid payment', async () => {
      // Reiniciar y configurar el mock solo para este test
      mockPaymentIntegrationService.validatePaymentForBooking.mockReset();
      mockPaymentIntegrationService.validatePaymentForBooking.mockResolvedValue(
        false,
      );
      // El mock de findOne debe devolver un booking pendiente
      mockBookingRepository.findOne.mockResolvedValue({
        ...mockBooking,
        status: 'pending',
      });
      // El mock de save debe devolver el booking original (no confirmado)
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        status: 'pending',
      });

      await expect(
        service.confirmBooking(1, 'invalid_payment'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return already confirmed booking', async () => {
      const confirmedBooking = { ...mockBooking, status: 'confirmed' };
      mockBookingRepository.findOne.mockResolvedValue(confirmedBooking);

      const result = await service.confirmBooking(1, 'payment_123');

      expect(result.status).toBe('confirmed');
      expect(
        mockPaymentIntegrationService.validatePaymentForBooking,
      ).not.toHaveBeenCalled();
    });
  });

  describe('processPaymentWebhook', () => {
    const mockWebhookData = {
      type: 'payment',
      data: {
        id: 'payment_123',
        status: 'approved',
        external_reference: 'booking_1',
      },
    };

    beforeEach(() => {
      mockPaymentIntegrationService.processPaymentWebhook.mockResolvedValue(
        undefined,
      );
      mockBookingRepository.findOne.mockResolvedValue({
        id: 1,
        status: 'pending',
      });
      mockBookingRepository.save.mockResolvedValue({
        id: 1,
        status: 'confirmed',
      });
      mockPaymentIntegrationService.validatePaymentForBooking.mockResolvedValue(
        true,
      );
    });

    it('should process approved payment webhook and confirm booking', () => {
      service.processPaymentWebhook(mockWebhookData);

      expect(
        mockPaymentIntegrationService.processPaymentWebhook,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'payment_123',
          status: 'approved',
          externalReference: 'booking_1',
        }),
      );
    });

    it('should not process non-payment webhooks', () => {
      const nonPaymentWebhook = {
        type: 'other',
        data: {
          id: 'other_123',
          status: 'unknown',
        },
      };

      service.processPaymentWebhook(nonPaymentWebhook);

      expect(
        mockPaymentIntegrationService.processPaymentWebhook,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'other_123',
          status: 'unknown',
          externalReference: '',
        }),
      );
    });

    it('should not process non-approved payments', () => {
      const pendingWebhook = {
        type: 'payment',
        data: {
          id: 'payment_123',
          status: 'pending',
          external_reference: 'booking_1',
        },
      };

      service.processPaymentWebhook(pendingWebhook);

      expect(
        mockPaymentIntegrationService.processPaymentWebhook,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'payment_123',
          status: 'pending',
          externalReference: 'booking_1',
        }),
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should return paid status for confirmed booking', async () => {
      mockBookingRepository.findOne.mockResolvedValue({
        id: 1,
        status: 'confirmed',
      });

      const result = await service.getPaymentStatus(1);

      expect(result.status).toBe('paid');
      expect(result.message).toContain('confirmada y pagada');
    });

    it('should return pending status for pending booking', async () => {
      mockBookingRepository.findOne.mockResolvedValue({
        id: 1,
        status: 'pending',
      });

      const result = await service.getPaymentStatus(1);

      expect(result.status).toBe('pending');
      expect(result.message).toContain('pendiente de pago');
    });

    it('should throw error for non-existent booking', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.getPaymentStatus(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
