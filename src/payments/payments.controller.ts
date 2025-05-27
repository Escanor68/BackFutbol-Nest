import { Controller, Post, Get, Body, Param, UseGuards, Req, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('preference')
  @UseGuards(JwtAuthGuard)
  async createPreference(
    @Req() req,
    @Body() body: { bookingId: number; payerEmail: string },
  ) {
    return this.paymentsService.createPreference(
      req.user.id,
      body.bookingId,
      body.payerEmail,
    );
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Req() req, @Param('id') paymentId: string) {
    return this.paymentsService.getPaymentStatus(req.user.id, paymentId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: { action: string; data: { id: string } }) {
    await this.paymentsService.handleWebhook(body.action, body.data);
    return { received: true };
  }
} 