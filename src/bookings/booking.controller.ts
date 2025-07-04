import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { ParseIntPipe } from '@nestjs/common';
import { ExternalJwtAuthGuard } from '../auth/guards/external-jwt-auth.guard';
import { ExternalRolesGuard } from '../auth/guards/external-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Booking } from './entities/booking.entity';

// DTO para creación de reservas
export class CreateBookingDto {
  fieldId: number;
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  isRecurrent?: boolean;
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate: string;
  };
}

// DTO para webhook de pagos
export class PaymentWebhookDto {
  type: string;
  data: {
    id: string;
    status: string;
    external_reference?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

@ApiTags('Reservas')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(ExternalJwtAuthGuard, ExternalRolesGuard)
  @Roles('user', 'admin')
  @ApiOperation({
    summary: 'Crear una nueva reserva',
    description: 'Crea una reserva de cancha con integración de pagos opcional',
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: 201,
    description: 'Reserva creada exitosamente',
    type: [Booking],
  })
  @ApiResponse({ status: 400, description: 'Datos de reserva inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Cancha no encontrada' })
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  @UseGuards(ExternalJwtAuthGuard, ExternalRolesGuard)
  @Roles('user', 'admin')
  @ApiOperation({
    summary: 'Obtener todas las reservas',
    description: 'Obtiene una lista de reservas con filtros opcionales',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'fieldId', required: false, type: Number })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de reservas obtenida exitosamente',
    type: [Booking],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(
    @Query('userId') userId?: number,
    @Query('fieldId') fieldId?: number,
    @Query('date') date?: string,
  ) {
    return this.bookingService.findAll({ userId, fieldId, date });
  }

  @Get(':id')
  @UseGuards(ExternalJwtAuthGuard, ExternalRolesGuard)
  @Roles('user', 'admin')
  @ApiOperation({
    summary: 'Obtener una reserva por ID',
    description: 'Obtiene los detalles de una reserva específica',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la reserva' })
  @ApiResponse({
    status: 200,
    description: 'Reserva obtenida exitosamente',
    type: Booking,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(ExternalJwtAuthGuard, ExternalRolesGuard)
  @Roles('user', 'admin')
  @ApiOperation({
    summary: 'Cancelar una reserva',
    description: 'Cancela una reserva existente',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la reserva' })
  @ApiResponse({
    status: 200,
    description: 'Reserva cancelada exitosamente',
    type: Booking,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.cancel(id);
  }
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de pagos',
    description: 'Endpoint para recibir notificaciones de pagos desde BackMP',
  })
  @ApiBody({ type: PaymentWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de webhook inválidos' })
  paymentWebhook(@Body() webhookData: PaymentWebhookDto) {
    void this.bookingService.processPaymentWebhook(webhookData);
    return { message: 'Webhook procesado exitosamente' };
  }
}
