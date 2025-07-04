import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Field } from '../../soccer-field/entities/field.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@Index(['date', 'field'])
@Index(['userId', 'date'])
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Field, (field) => field.bookings)
  field: Field;

  @ManyToOne(() => User, (user) => user.bookings)
  user: User;

  @Column()
  userId: number;

  @Column('date')
  date: Date;

  @Column('time')
  startTime: string;

  @Column('time')
  endTime: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number; // Precio base del owner

  @Column('decimal', { precision: 10, scale: 2 })
  platformFee: number; // 10% de comisión

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number; // Lo que paga el usuario (solo platformFee)

  @Column({ nullable: true })
  notes: string;

  // Para reservas recurrentes
  @Column({ nullable: true })
  recurrenceId: string;

  @Column({ default: false })
  isRecurrent: boolean;
}
