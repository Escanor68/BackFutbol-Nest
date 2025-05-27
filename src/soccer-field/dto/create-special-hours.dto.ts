import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateSpecialHoursDto {
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsNotEmpty()
  @IsBoolean()
  isClosed: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
} 