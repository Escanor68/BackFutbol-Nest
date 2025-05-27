import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Field } from '../../soccer-field/entities/field.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Field, field => field.bookings)
  field: Field;

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
  totalPrice: number;
} 