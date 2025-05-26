import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('soccer_field')
export class SoccerField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fieldName: string;

  @Column({ type: 'varchar', length: 255 })
  schedule: string;

  @Column({ type: 'int' })
  owner: number;

  @Column({ type: 'varchar', length: 8 })
  reservation: 'Active' | 'Inactive';

  @Column({ type: 'int', nullable: true })
  whoReservedId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  whoReservedName: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;
} 