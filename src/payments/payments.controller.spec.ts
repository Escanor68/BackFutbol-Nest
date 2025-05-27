import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPayment = {
    id: 'payment-uuid',
    status: 'pending',
    detail: {},
    preferenceId: 'pref-123',
    mercadoPagoId: 'mp-123',
  };

  const mockPreference = {
    id: 'payment-uuid',
    init_point: 'https://mercadopago.com/checkout',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            createPreference: jest.fn().mockResolvedValue(mockPreference),
            getPaymentStatus: jest.fn().mockResolvedValue(mockPayment),
            getAllPayments: jest.fn().mockResolvedValue({ payments: [mockPayment] }),
            handleWebhook: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPreference', () => {
    it('should create a payment preference', async () => {
      const mockReq = { user: { id: 1 } };
      const mockBody = { bookingId: 1, payerEmail: 'test@example.com' };

      const result = await controller.createPreference(mockReq, mockBody);
      expect(result).toEqual(mockPreference);
      expect(service.createPreference).toHaveBeenCalledWith(1, 1, 'test@example.com');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const mockReq = { user: { id: 1 } };
      const result = await controller.getPaymentStatus(mockReq, 'payment-uuid');
      expect(result).toEqual(mockPayment);
      expect(service.getPaymentStatus).toHaveBeenCalledWith(1, 'payment-uuid');
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const result = await controller.getAllPayments();
      expect(result).toEqual({ payments: [mockPayment] });
      expect(service.getAllPayments).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook notification', async () => {
      const mockBody = {
        action: 'payment.created',
        data: { id: 'mp-123' },
      };

      const result = await controller.handleWebhook(mockBody);
      expect(result).toEqual({ received: true });
      expect(service.handleWebhook).toHaveBeenCalledWith(
        mockBody.action,
        mockBody.data,
      );
    });
  });
}); 