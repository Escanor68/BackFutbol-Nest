import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSoccerFieldDto {
  @ApiProperty({ description: 'The ID of the field owner' })
  @IsNotEmpty()
  @IsNumber()
  userField: number;

  @ApiProperty({ description: 'Start time of availability (HH:mm format)' })
  @IsNotEmpty()
  @IsString()
  availableFrom: string;

  @ApiProperty({ description: 'End time of availability (HH:mm format)' })
  @IsNotEmpty()
  @IsString()
  availableUntil: string;

  @ApiProperty({ description: 'Name of the soccer field' })
  @IsNotEmpty()
  @IsString()
  fieldName: string;

  @ApiProperty({ description: 'Base price for the field' })
  @IsNotEmpty()
  @IsNumber()
  price: number;
} 