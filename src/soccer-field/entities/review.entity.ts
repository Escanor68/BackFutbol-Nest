import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Field } from './field.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@Unique(['userId', 'field'])
@Index('idx_review_rating', ['rating'])
@Index('idx_review_field', ['field'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.reviews)
  user: User;

  @Column()
  userName: string;

  @ManyToOne(() => Field, (field) => field.reviews)
  field: Field;

  @Column('int')
  rating: number;

  @Column('text')
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
