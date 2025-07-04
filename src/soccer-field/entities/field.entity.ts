import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Review } from '../entities/review.entity';
import { SpecialHours } from '../entities/special-hours.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@Index('idx_field_location', ['latitude', 'longitude'])
@Index('idx_field_price', ['pricePerHour'])
@Index('idx_field_rating', ['averageRating'])
@Index('idx_field_owner', ['ownerId'])
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

  @ManyToOne(() => User, (user) => user.fields)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método para calcular precio con comisión
  get displayPrice(): number {
    return Number((this.pricePerHour * 1.1).toFixed(2));
  }

  // Método para calcular solo la comisión que paga el usuario
  get platformFeeOnly(): number {
    return Number((this.pricePerHour * 0.1).toFixed(2));
  }
}
