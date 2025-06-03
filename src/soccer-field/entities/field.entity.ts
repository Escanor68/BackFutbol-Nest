import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../entities/review.entity';
import { SpecialHours } from '../entities/special-hours.entity';

@Entity()
export class Field {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerHour: number;

  @Column('json')
  businessHours: {
    day: number;
    openTime: string;
    closeTime: string;
  }[];

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  surface: string;

  @Column({ default: false })
  hasLighting: boolean;

  @Column({ default: false })
  isIndoor: boolean;

  @Column('simple-array', { nullable: true })
  amenities: string[];

  @Column({ nullable: true })
  maxPlayers: number;

  @Column('simple-array', { nullable: true })
  rules: string[];

  @Column({ nullable: true })
  cancellationPolicy: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @OneToMany(() => Booking, (booking) => booking.field)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.field)
  reviews: Review[];

  @OneToMany(() => SpecialHours, (specialHours) => specialHours.field)
  specialHours: SpecialHours[];

  @Column()
  ownerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
