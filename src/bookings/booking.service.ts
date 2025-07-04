import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Field } from '../soccer-field/entities/field.entity';
import { SpecialHours } from '../soccer-field/entities/special-hours.entity';
import {
  PricingService,
  PriceBreakdown,
} from '../common/services/pricing.service';
import { PaymentIntegrationService } from '../common/services/payment-integration.service';

export interface CreateBookingDto {
  fieldId: number;
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  isRecurrent?: boolean;
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number; // cada X días/semanas/meses
    endDate: string;
  };
}

export interface BookingWithPayment {
  bookings: Booking[];
  priceBreakdown: PriceBreakdown;
  message: string;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Field)
    private fieldRepository: Repository<Field>,
    @InjectRepository(SpecialHours)
    private specialHoursRepository: Repository<SpecialHours>,
    private pricingService: PricingService,
    private paymentIntegrationService: PaymentIntegrationService,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
  ): Promise<BookingWithPayment> {
    const field = await this.fieldRepository.findOne({
      where: { id: createBookingDto.fieldId },
    });

    if (!field) {
      throw new NotFoundException('Cancha no encontrada');
    }

    const date = new Date(createBookingDto.date);

    // Validar horarios de negocio
    if (
      !this.isWithinBusinessHours(
        field,
        date,
        createBookingDto.startTime,
        createBookingDto.endTime,
      )
    ) {
      throw new BadRequestException(
        'El horario solicitado está fuera del horario de funcionamiento',
      );
    }

    // Verificar horarios especiales
    const specialHours = await this.specialHoursRepository.find({
      where: { field: { id: field.id }, date: date },
    });

    // Verificar si la cancha está cerrada en horario especial
    const specialHour = specialHours.find((sh) => sh.isClosed);
    if (specialHour) {
      throw new BadRequestException(
        `La cancha está cerrada este día: ${specialHour.reason}`,
      );
    }

    // Verificar disponibilidad
    const isAvailable = await this.checkAvailability(
      field.id,
      date,
      createBookingDto.startTime,
      createBookingDto.endTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('Este horario no está disponible');
    }

    // Calcular precios usando PricingService
    const priceBreakdown = this.pricingService.calculateBookingPrice(
      field,
      createBookingDto.startTime,
      createBookingDto.endTime,
      date,
      specialHours,
    );

    // Aplicar descuentos off-peak si corresponde
    const offPeakDiscount = this.pricingService.calculateOffPeakDiscount(
      createBookingDto.startTime,
    );

    const finalPricing = this.pricingService.applyDiscounts(
      priceBreakdown,
      offPeakDiscount,
    );

    // Crear reserva con estado 'pending' hasta que se confirme el pago
    let bookings: Booking[] = [];

    if (createBookingDto.isRecurrent && createBookingDto.recurrencePattern) {
      bookings = await this.createRecurrentBookings(
        createBookingDto,
        field,
        finalPricing,
      );
    } else {
      const booking = await this.createSingleBooking(
        createBookingDto,
        field,
        finalPricing,
      );
      bookings = [booking];
    }

    return {
      bookings,
      priceBreakdown: finalPricing,
      message:
        bookings.length === 1
          ? 'Reserva creada exitosamente'
          : `Se crearon ${bookings.length} reservas recurrentes`,
    };
  }

  /**
   * Confirma una reserva después de un pago exitoso
   */
  async confirmBooking(bookingId: number, paymentId: string): Promise<Booking> {
    const booking = await this.findOne(bookingId);

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (booking.status === 'confirmed') {
      return booking; // Ya está confirmada
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException(
        'No se puede confirmar una reserva cancelada',
      );
    }

    // Validar el pago con BackMP
    const isPaymentValid =
      await this.paymentIntegrationService.validatePaymentForBooking(
        bookingId,
        paymentId,
      );

    if (!isPaymentValid) {
      throw new BadRequestException('Pago no válido o no aprobado');
    }

    // Confirmar la reserva
    booking.status = 'confirmed';
    return this.bookingRepository.save(booking);
  }

  /**
   * Obtiene el estado de pago de una reserva
   */
  async getPaymentStatus(bookingId: number) {
    const booking = await this.findOne(bookingId);

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Si la reserva está confirmada, el pago ya fue procesado
    if (booking.status === 'confirmed') {
      return {
        bookingId,
        status: 'paid',
        message: 'Reserva confirmada y pagada',
      };
    }

    // Si está pendiente, intentar obtener información del pago
    if (booking.status === 'pending') {
      try {
        // En una implementación real, buscaríamos el paymentId asociado a la reserva
        // Por ahora, simulamos que no hay pago pendiente
        return {
          bookingId,
          status: 'pending',
          message: 'Reserva pendiente de pago',
        };
      } catch (error) {
        this.logger.error(
          `Error obteniendo estado de pago para reserva ${bookingId}:`,
          error,
        );
        return {
          bookingId,
          status: 'error',
          message: 'Error obteniendo estado de pago',
        };
      }
    }

    return {
      bookingId,
      status: booking.status,
      message: `Reserva en estado: ${booking.status}`,
    };
  }

  /**
   * Procesa un webhook de pago desde BackMP
   */
  processPaymentWebhook(webhookData: {
    type: string;
    data: {
      id: string;
      status: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }): void {
    try {
      // Extraer datos del webhook para pasarlos al servicio de pagos
      const paymentData = {
        id: webhookData.data?.id || '',
        status: webhookData.data?.status || '',
        externalReference:
          typeof webhookData.data?.external_reference === 'string'
            ? webhookData.data.external_reference
            : '',
        amount: 0, // Se obtendría del webhook en una implementación real
        currency: 'ARS',
      };

      this.paymentIntegrationService.processPaymentWebhook(paymentData);

      // Procesar webhook de pago exitoso
      if (webhookData.type === 'payment' && webhookData.data?.id) {
        const paymentId = webhookData.data.id;
        const status = webhookData.data.status;

        if (status === 'approved') {
          // Buscar reservas pendientes relacionadas con este pago
          // Por ahora, asumimos que el externalReference contiene el bookingId
          // En una implementación real, esto vendría del webhook
          const externalReference = webhookData.data.external_reference;
          if (
            typeof externalReference === 'string' &&
            externalReference.startsWith('booking_')
          ) {
            const bookingId = parseInt(
              externalReference.replace('booking_', ''),
              10,
            );

            if (!isNaN(bookingId)) {
              try {
                // Confirmar la reserva de forma asíncrona
                void this.confirmBooking(bookingId, paymentId);
                this.logger.log(
                  `Reserva ${bookingId} confirmada automáticamente por pago ${paymentId}`,
                );
              } catch (error) {
                this.logger.error(
                  `Error confirmando reserva ${bookingId}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                );
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error procesando webhook de pago:', error);
      throw error;
    }
  }

  private async createSingleBooking(
    createBookingDto: CreateBookingDto,
    field: Field,
    pricing: PriceBreakdown,
  ): Promise<Booking> {
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      field,
      date: new Date(createBookingDto.date),
      basePrice: pricing.basePrice,
      platformFee: pricing.platformFee,
      totalPrice: pricing.userPayment, // Usuario paga solo la comisión
      status: 'pending', // Cambiado a pending hasta confirmar pago
    });

    return this.bookingRepository.save(booking);
  }

  private async createRecurrentBookings(
    createBookingDto: CreateBookingDto,
    field: Field,
    pricing: PriceBreakdown,
  ): Promise<Booking[]> {
    const { recurrencePattern } = createBookingDto;
    if (!recurrencePattern) {
      throw new BadRequestException(
        'Patrón de recurrencia requerido para reservas recurrentes',
      );
    }

    const bookings: Booking[] = [];
    const recurrenceId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const currentDate = new Date(createBookingDto.date);
    const endDate = new Date(recurrencePattern.endDate);

    while (currentDate <= endDate) {
      // Verificar disponibilidad para cada fecha
      const isAvailable = await this.checkAvailability(
        field.id,
        currentDate,
        createBookingDto.startTime,
        createBookingDto.endTime,
      );

      if (isAvailable) {
        const booking = this.bookingRepository.create({
          ...createBookingDto,
          field,
          date: new Date(currentDate),
          basePrice: pricing.basePrice,
          platformFee: pricing.platformFee,
          totalPrice: pricing.userPayment,
          status: 'pending', // Cambiado a pending hasta confirmar pago
          isRecurrent: true,
          recurrenceId,
        });

        bookings.push(booking);
      }

      this.advanceDate(currentDate, recurrencePattern);
    }

    return this.bookingRepository.save(bookings);
  }

  private advanceDate(
    date: Date,
    pattern: NonNullable<CreateBookingDto['recurrencePattern']>,
  ): void {
    switch (pattern.type) {
      case 'daily':
        date.setDate(date.getDate() + pattern.interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7 * pattern.interval);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + pattern.interval);
        break;
    }
  }

  private isWithinBusinessHours(
    field: Field,
    date: Date,
    startTime: string,
    endTime: string,
  ): boolean {
    const dayOfWeek = date.getDay();
    const businessHour = field.businessHours.find((bh) => bh.day === dayOfWeek);

    if (!businessHour) return false;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const open = new Date(`2000-01-01T${businessHour.openTime}`);
    const close = new Date(`2000-01-01T${businessHour.closeTime}`);

    return start >= open && end <= close;
  }

  async findAll(filters?: {
    userId?: number;
    fieldId?: number;
    date?: string;
    status?: string;
  }) {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.field', 'field')
      .leftJoinAndSelect('booking.user', 'user');

    if (filters?.userId) {
      query.andWhere('booking.userId = :userId', { userId: filters.userId });
    }

    if (filters?.fieldId) {
      query.andWhere('field.id = :fieldId', { fieldId: filters.fieldId });
    }

    if (filters?.date) {
      query.andWhere('booking.date = :date', { date: filters.date });
    }

    if (filters?.status) {
      query.andWhere('booking.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['field', 'user'],
    });

    if (!booking) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    return booking;
  }

  async cancel(id: number, reason?: string) {
    const booking = await this.findOne(id);

    // Validar si se puede cancelar (ej: no menos de 2 horas antes)
    const now = new Date();
    const bookingDateTime = new Date(
      `${booking.date.toISOString().split('T')[0]}T${booking.startTime}`,
    );
    const hoursUntilBooking =
      (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
      throw new BadRequestException(
        'No se puede cancelar con menos de 2 horas de anticipación',
      );
    }

    booking.status = 'cancelled';
    if (reason) {
      booking.notes = `Cancelado: ${reason}`;
    }

    return this.bookingRepository.save(booking);
  }

  // Cancelar todas las reservas de una serie recurrente
  async cancelRecurrentSeries(recurrenceId: string, reason?: string) {
    const bookings = await this.bookingRepository.find({
      where: { recurrenceId, status: 'confirmed' },
    });

    for (const booking of bookings) {
      booking.status = 'cancelled';
      if (reason) {
        booking.notes = `Serie cancelada: ${reason}`;
      }
    }

    return this.bookingRepository.save(bookings);
  }

  private async checkAvailability(
    fieldId: number,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const existingBookings = await this.bookingRepository.find({
      where: {
        field: { id: fieldId },
        date: date,
        status: 'confirmed',
      },
    });

    return !existingBookings.some(
      (booking) =>
        (startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime) ||
        (startTime <= booking.startTime && endTime >= booking.endTime),
    );
  }
}
