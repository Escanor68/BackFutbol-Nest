import { Injectable } from '@nestjs/common';
import { Field } from '../../soccer-field/entities/field.entity';
import { SpecialHours } from '../../soccer-field/entities/special-hours.entity';

export interface PriceBreakdown {
  basePrice: number; // Precio base del owner
  platformFee: number; // 10% comisión
  displayPrice: number; // Lo que se muestra al usuario (base + fee)
  userPayment: number; // Lo que paga el usuario (solo fee)
  hours: number; // Duración en horas
  isSpecialHour: boolean; // Si aplica precio especial
  specialPrice?: number; // Precio especial si aplica
}

@Injectable()
export class PricingService {
  private readonly PLATFORM_FEE_PERCENTAGE = 0.1; // 10%

  /**
   * Calcula el precio total para una reserva
   */
  calculateBookingPrice(
    field: Field,
    startTime: string,
    endTime: string,
    date: Date,
    specialHours?: SpecialHours[],
  ): PriceBreakdown {
    const hours = this.calculateHours(startTime, endTime);

    // Verificar si hay precio especial para esta fecha
    const specialHour = this.findSpecialHourForDate(date, specialHours);

    let basePrice: number;
    let isSpecialHour = false;

    if (specialHour && specialHour.specialPrice) {
      basePrice = specialHour.specialPrice * hours;
      isSpecialHour = true;
    } else {
      basePrice = field.pricePerHour * hours;
    }

    const platformFee = basePrice * this.PLATFORM_FEE_PERCENTAGE;
    const displayPrice = basePrice + platformFee;
    const userPayment = platformFee; // Usuario solo paga la comisión

    return {
      basePrice,
      platformFee,
      displayPrice,
      userPayment,
      hours,
      isSpecialHour,
      specialPrice: specialHour?.specialPrice,
    };
  }

  /**
   * Calcula precio por hora mostrado al usuario (con comisión incluida)
   */
  getDisplayPricePerHour(field: Field, specialPrice?: number): number {
    const basePrice = specialPrice || field.pricePerHour;
    return Number((basePrice * (1 + this.PLATFORM_FEE_PERCENTAGE)).toFixed(2));
  }

  /**
   * Calcula solo la comisión por hora que paga el usuario
   */
  getPlatformFeePerHour(field: Field, specialPrice?: number): number {
    const basePrice = specialPrice || field.pricePerHour;
    return Number((basePrice * this.PLATFORM_FEE_PERCENTAGE).toFixed(2));
  }

  /**
   * Calcula descuentos por horarios off-peak (opcional)
   */
  calculateOffPeakDiscount(startTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const startHour = start.getHours();

    // Descuento del 15% para horarios de 8:00 a 16:00
    if (startHour >= 8 && startHour < 16) {
      return 0.15; // 15% descuento
    }

    return 0; // Sin descuento
  }

  /**
   * Aplica descuentos si corresponde
   */
  applyDiscounts(
    breakdown: PriceBreakdown,
    discountPercentage: number,
  ): PriceBreakdown {
    if (discountPercentage === 0) return breakdown;

    const discountAmount = breakdown.basePrice * discountPercentage;
    const newBasePrice = breakdown.basePrice - discountAmount;
    const newPlatformFee = newBasePrice * this.PLATFORM_FEE_PERCENTAGE;

    return {
      ...breakdown,
      basePrice: Number(newBasePrice.toFixed(2)),
      platformFee: Number(newPlatformFee.toFixed(2)),
      displayPrice: Number((newBasePrice + newPlatformFee).toFixed(2)),
      userPayment: Number(newPlatformFee.toFixed(2)),
    };
  }

  private calculateHours(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private findSpecialHourForDate(
    date: Date,
    specialHours?: SpecialHours[],
  ): SpecialHours | undefined {
    if (!specialHours) return undefined;

    return specialHours.find((sh) => {
      const specialDate = new Date(sh.date);
      return specialDate.toDateString() === date.toDateString();
    });
  }
}
