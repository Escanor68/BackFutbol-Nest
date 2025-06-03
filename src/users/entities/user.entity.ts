import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Field } from '../../soccer-field/entities/field.entity';
import { Review } from '../../soccer-field/entities/review.entity';

export enum UserRole {
  PLAYER = 'player',
  FIELD_OWNER = 'field_owner',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  profileImage: string;

  @OneToMany(() => Booking, (booking) => booking.userId)
  bookings: Booking[];

  @OneToMany(() => Field, (field) => field.ownerId)
  fields: Field[];

  @OneToMany(() => Review, (review) => review.userId)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método para obtener el nombre completo
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
