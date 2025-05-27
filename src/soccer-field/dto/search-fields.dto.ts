import { IsOptional, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';

export class SearchFieldsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  surface?: string;

  @IsOptional()
  @IsBoolean()
  hasLighting?: boolean;

  @IsOptional()
  @IsBoolean()
  isIndoor?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;
} 