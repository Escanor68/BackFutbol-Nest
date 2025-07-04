import { Injectable } from '@nestjs/common';
import { I18nService as NestI18nService } from 'nestjs-i18n';

@Injectable()
export class I18nService {
  constructor(private readonly i18n: NestI18nService) {}

  translate(
    key: string,
    options?: { args?: Record<string, any>; lang?: string },
  ): string {
    const lang = options?.lang || 'es'; // Default a español
    return this.i18n.translate(key, { lang, args: options?.args });
  }

  // Métodos específicos para errores comunes
  fieldNotFound(lang = 'es'): string {
    return this.translate('errors.fieldNotFound', { lang });
  }

  userNotFound(lang = 'es'): string {
    return this.translate('errors.userNotFound', { lang });
  }

  bookingNotFound(id: number, lang = 'es'): string {
    return this.translate('errors.bookingNotFound', { args: { id }, lang });
  }

  unavailableTimeSlot(lang = 'es'): string {
    return this.translate('errors.unavailableTimeSlot', { lang });
  }

  outsideBusinessHours(lang = 'es'): string {
    return this.translate('errors.outsideBusinessHours', { lang });
  }

  fieldClosedSpecialHours(reason: string, lang = 'es'): string {
    return this.translate('errors.fieldClosedSpecialHours', {
      args: { reason },
      lang,
    });
  }

  cancelTooLate(lang = 'es'): string {
    return this.translate('errors.cancelTooLate', { lang });
  }

  duplicateReview(lang = 'es'): string {
    return this.translate('errors.duplicateReview', { lang });
  }

  specialHoursConflict(time1: string, time2: string, lang = 'es'): string {
    return this.translate('errors.specialHoursConflict', {
      args: { time1, time2 },
      lang,
    });
  }

  specialHoursOutsideBusiness(
    specialTime: string,
    businessTime: string,
    lang = 'es',
  ): string {
    return this.translate('errors.specialHoursOutsideBusiness', {
      args: { specialTime, businessTime },
      lang,
    });
  }

  invalidTimeRange(lang = 'es'): string {
    return this.translate('errors.invalidTimeRange', { lang });
  }

  recurrencePatternRequired(lang = 'es'): string {
    return this.translate('errors.recurrencePatternRequired', { lang });
  }

  emailAlreadyExists(lang = 'es'): string {
    return this.translate('errors.emailAlreadyExists', { lang });
  }

  // Métodos para mensajes de éxito
  bookingCreated(lang = 'es'): string {
    return this.translate('success.bookingCreated', { lang });
  }

  recurrentBookingsCreated(count: number, lang = 'es'): string {
    return this.translate('success.recurrentBookingsCreated', {
      args: { count },
      lang,
    });
  }

  bookingCancelled(lang = 'es'): string {
    return this.translate('success.bookingCancelled', { lang });
  }

  reviewCreated(lang = 'es'): string {
    return this.translate('success.reviewCreated', { lang });
  }

  fieldCreated(lang = 'es'): string {
    return this.translate('success.fieldCreated', { lang });
  }

  userCreated(lang = 'es'): string {
    return this.translate('success.userCreated', { lang });
  }

  // Método para obtener el idioma del header de la request
  getLanguageFromHeaders(headers: Record<string, string | string[]>): string {
    const acceptLanguage = headers['accept-language'];
    if (acceptLanguage && typeof acceptLanguage === 'string') {
      // Extraer el primer idioma de Accept-Language
      const primaryLang = acceptLanguage.split(',')[0]?.split('-')[0];
      return primaryLang && ['es', 'en'].includes(primaryLang)
        ? primaryLang
        : 'es';
    }
    return 'es';
  }

  // Traducciones para enums
  translateUserRole(role: string, lang = 'es'): string {
    return this.translate(`user.roles.${role}`, { lang });
  }

  translateBookingStatus(status: string, lang = 'es'): string {
    return this.translate(`booking.status.${status}`, { lang });
  }

  translateSurface(surface: string, lang = 'es'): string {
    return this.translate(`field.surface.${surface}`, { lang });
  }

  translateAmenity(amenity: string, lang = 'es'): string {
    return this.translate(`field.amenities.${amenity}`, { lang });
  }
}
