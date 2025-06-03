import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFieldDto {
  @ApiProperty({ description: 'Nombre del campo' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Dirección del campo' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Latitud del campo' })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitud del campo' })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Precio por hora' })
  @IsNotEmpty()
  @IsNumber()
  pricePerHour: number;

  @ApiProperty({ description: 'Horarios de funcionamiento' })
  @IsNotEmpty()
  @IsArray()
  businessHours: {
    day: number;
    openTime: string;
    closeTime: string;
  }[];

  @ApiProperty({ description: 'Descripción del campo', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL de imagen del campo', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Superficie del campo' })
  @IsNotEmpty()
  @IsString()
  surface: string;

  @ApiProperty({ description: 'Tiene iluminación', required: false })
  @IsOptional()
  @IsBoolean()
  hasLighting?: boolean;

  @ApiProperty({ description: 'Es cubierto', required: false })
  @IsOptional()
  @IsBoolean()
  isIndoor?: boolean;

  @ApiProperty({ description: 'Amenidades', required: false })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiProperty({ description: 'Número máximo de jugadores', required: false })
  @IsOptional()
  @IsNumber()
  maxPlayers?: number;

  @ApiProperty({ description: 'Reglas del campo', required: false })
  @IsOptional()
  @IsArray()
  rules?: string[];

  @ApiProperty({ description: 'Política de cancelación', required: false })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiProperty({ description: 'ID del propietario' })
  @IsNotEmpty()
  @IsNumber()
  ownerId: number;
}
