import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchFieldsDto {
  @ApiProperty({ description: 'Precio mínimo por hora', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ description: 'Precio máximo por hora', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ description: 'Superficie de la cancha', required: false })
  @IsOptional()
  @IsString()
  surface?: string;

  @ApiProperty({ description: 'Tiene iluminación', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasLighting?: boolean;

  @ApiProperty({ description: 'Es cubierta', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isIndoor?: boolean;

  @ApiProperty({
    description: 'Latitud para búsqueda por proximidad',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Longitud para búsqueda por proximidad',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'Radio de búsqueda en kilómetros',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radius?: number;

  @ApiProperty({ description: 'Calificación mínima', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;
}
