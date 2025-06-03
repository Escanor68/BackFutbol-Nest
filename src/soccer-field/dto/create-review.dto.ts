import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID del usuario que hace la reseña' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Nombre del usuario' })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiProperty({ description: 'Calificación de 1 a 5', minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Comentario de la reseña', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
