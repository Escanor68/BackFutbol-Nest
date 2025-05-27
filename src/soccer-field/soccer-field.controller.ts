import { Controller, Post, Get, Body, Query, UseGuards, ValidationPipe, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SoccerFieldService } from './soccer-field.service';
import { CreateSoccerFieldDto } from './dto/create-soccer-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SoccerField } from './entities/soccer-field.entity';
import { ParseIntPipe } from '@nestjs/common';

@ApiTags('soccer-fields')
@Controller('fields')
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
  findAll() {
    return this.soccerFieldService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.soccerFieldService.findNearby(lat, lng, radius);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.soccerFieldService.findOne(id);
  }

  @Get(':id/availability')
  getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') dateStr: string,
  ) {
    const date = new Date(dateStr);
    return this.soccerFieldService.getAvailability(id, date);
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
} 