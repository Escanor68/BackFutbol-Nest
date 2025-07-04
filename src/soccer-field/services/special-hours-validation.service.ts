import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialHours } from '../entities/special-hours.entity';
import { Field } from '../entities/field.entity';

@Injectable()
export class SpecialHoursValidationService {
  constructor(
    @InjectRepository(SpecialHours)
    private specialHoursRepository: Repository<SpecialHours>,
  ) {}

  /**
   * Valida que no haya solapamientos en horarios especiales
   */
  async validateNoOverlaps(
    fieldId: number,
    date: Date,
    openTime?: string,
    closeTime?: string,
    excludeId?: number,
  ): Promise<void> {
    if (!openTime || !closeTime) return;

    const existingSpecialHours = await this.specialHoursRepository.find({
      where: { field: { id: fieldId }, date },
    });

    // Filtrar el registro actual si es una actualización
    const filteredHours = excludeId
      ? existingSpecialHours.filter((sh) => sh.id !== excludeId)
      : existingSpecialHours;

    for (const existingHour of filteredHours) {
      if (existingHour.isClosed) continue;
      if (!existingHour.openTime || !existingHour.closeTime) continue;

      if (
        this.hasTimeOverlap(
          openTime,
          closeTime,
          existingHour.openTime,
          existingHour.closeTime,
        )
      ) {
        throw new BadRequestException(
          `Conflicto de horarios: ${openTime}-${closeTime} se solapa con ${existingHour.openTime}-${existingHour.closeTime}`,
        );
      }
    }
  }

  /**
   * Valida que los horarios especiales estén dentro del horario de negocio
   */
  validateWithinBusinessHours(
    field: Field,
    date: Date,
    openTime?: string,
    closeTime?: string,
  ): void {
    if (!openTime || !closeTime) return;

    const dayOfWeek = date.getDay();
    const businessHour = field.businessHours.find((bh) => bh.day === dayOfWeek);

    if (!businessHour) {
      throw new BadRequestException('La cancha no opera este día de la semana');
    }

    const specialOpen = new Date(`2000-01-01T${openTime}`);
    const specialClose = new Date(`2000-01-01T${closeTime}`);
    const businessOpen = new Date(`2000-01-01T${businessHour.openTime}`);
    const businessClose = new Date(`2000-01-01T${businessHour.closeTime}`);

    if (specialOpen < businessOpen || specialClose > businessClose) {
      throw new BadRequestException(
        `Los horarios especiales (${openTime}-${closeTime}) deben estar dentro del horario de negocio (${businessHour.openTime}-${businessHour.closeTime})`,
      );
    }
  }

  /**
   * Valida que el rango de tiempo sea coherente
   */
  validateTimeRange(
    openTime?: string,
    closeTime?: string,
    isClosed?: boolean,
  ): void {
    if (isClosed) return;

    if (!openTime || !closeTime) {
      throw new BadRequestException(
        'Debe especificar hora de apertura y cierre para horarios especiales',
      );
    }

    const open = new Date(`2000-01-01T${openTime}`);
    const close = new Date(`2000-01-01T${closeTime}`);

    if (open >= close) {
      throw new BadRequestException(
        'La hora de apertura debe ser anterior a la hora de cierre',
      );
    }
  }

  /**
   * Verifica si dos rangos de tiempo se solapan
   */
  private hasTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const s1 = new Date(`2000-01-01T${start1}`);
    const e1 = new Date(`2000-01-01T${end1}`);
    const s2 = new Date(`2000-01-01T${start2}`);
    const e2 = new Date(`2000-01-01T${end2}`);

    return s1 < e2 && s2 < e1;
  }

  /**
   * Obtiene todos los conflictos para una fecha específica
   */
  async getConflicts(
    fieldId: number,
    date: Date,
  ): Promise<{
    overlaps: Array<{
      hour1: SpecialHours;
      hour2: SpecialHours;
    }>;
    businessHourConflicts: SpecialHours[];
  }> {
    const specialHours = await this.specialHoursRepository.find({
      where: { field: { id: fieldId }, date },
      relations: ['field'],
    });

    const overlaps: Array<{ hour1: SpecialHours; hour2: SpecialHours }> = [];
    const businessHourConflicts: SpecialHours[] = [];

    // Verificar solapamientos entre horarios especiales
    for (let i = 0; i < specialHours.length; i++) {
      for (let j = i + 1; j < specialHours.length; j++) {
        const hour1 = specialHours[i];
        const hour2 = specialHours[j];

        if (hour1.isClosed || hour2.isClosed) continue;
        if (
          !hour1.openTime ||
          !hour1.closeTime ||
          !hour2.openTime ||
          !hour2.closeTime
        )
          continue;

        if (
          this.hasTimeOverlap(
            hour1.openTime,
            hour1.closeTime,
            hour2.openTime,
            hour2.closeTime,
          )
        ) {
          overlaps.push({ hour1, hour2 });
        }
      }
    }

    // Verificar conflictos con horarios de negocio
    for (const specialHour of specialHours) {
      if (
        specialHour.isClosed ||
        !specialHour.openTime ||
        !specialHour.closeTime
      )
        continue;

      try {
        this.validateWithinBusinessHours(
          specialHour.field,
          date,
          specialHour.openTime,
          specialHour.closeTime,
        );
      } catch {
        businessHourConflicts.push(specialHour);
      }
    }

    return { overlaps, businessHourConflicts };
  }
}
