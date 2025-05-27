import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Field } from './field.entity';

@Entity()
export class SpecialHours {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Field, field => field.specialHours)
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
} 