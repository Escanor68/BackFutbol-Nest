import { Controller, Post, Get, Body, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SoccerFieldService } from './soccer-field.service';
import { CreateSoccerFieldDto } from './dto/create-soccer-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SoccerField } from './entities/soccer-field.entity';

@ApiTags('soccer-fields')
@Controller('api/v1/soccer-fields')
export class SoccerFieldController {
  constructor(private readonly soccerFieldService: SoccerFieldService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create soccer field shifts' })
  @ApiResponse({ status: 201, description: 'Shifts created successfully' })
  async createShifts(@Body(ValidationPipe) createDto: CreateSoccerFieldDto): Promise<void> {
    await this.soccerFieldService.createShifts(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get fields by owner' })
  @ApiResponse({ status: 200, type: [SoccerField] })
  async getFieldsByOwner(@Query('userField') userField: number): Promise<SoccerField[]> {
    return this.soccerFieldService.getFieldsByOwner(userField);
  }

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reserve a field' })
  @ApiResponse({ status: 200, description: 'Field reserved successfully' })
  async reserveField(
    @Body(ValidationPipe) reserveDto: {
      owner: number;
      fieldName: string;
      schedule: string;
      whoReservedId: number;
      whoReservedName: string;
    },
  ): Promise<void> {
    await this.soccerFieldService.reserveField(
      reserveDto.owner,
      reserveDto.fieldName,
      reserveDto.schedule,
      reserveDto.whoReservedId,
      reserveDto.whoReservedName,
    );
  }

  @Post('release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release a field' })
  @ApiResponse({ status: 200, description: 'Field released successfully' })
  async releaseField(@Body('id') id: string): Promise<void> {
    await this.soccerFieldService.releaseField(id);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby fields' })
  @ApiResponse({ status: 200, type: [SoccerField] })
  async getNearbyFields(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ): Promise<SoccerField[]> {
    return this.soccerFieldService.getNearbyFields(latitude, longitude, radius);
  }
} 