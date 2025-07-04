import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field } from './field.entity';

@Entity()
@Index('idx_special_hours_date', ['field', 'date'])
export class SpecialHours {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Field, (field) => field.specialHours)
  field: Field;

  @Column('date')
  date: Date;

  @Column({ nullable: true })
  openTime: string;

  @Column({ nullable: true })
  closeTime: string;

  @Column({ default: false })
  isClosed: boolean;

  @Column({ nullable: true })
  reason: string;

  // Precio especial para este horario (opcional)
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  specialPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Validar que openTime < closeTime
  validateTimeRange(): boolean {
    if (this.isClosed) return true;
    if (!this.openTime || !this.closeTime) return false;

    const open = new Date(`2000-01-01T${this.openTime}`);
    const close = new Date(`2000-01-01T${this.closeTime}`);

    return open < close;
  }
}
