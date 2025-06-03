import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Param,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SoccerFieldService, TimeSlot } from './soccer-field.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseIntPipe } from '@nestjs/common';
import { CreateFieldDto } from './dto/create-field.dto';
import { SearchFieldsDto } from './dto/search-fields.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateSpecialHoursDto } from './dto/create-special-hours.dto';
import { UserRole } from '../users/entities/user.entity';

interface RequestWithUser {
  user: {
    id: number;
    role: UserRole;
  };
}

@ApiTags('fields')
@Controller('fields')
export class SoccerFieldController {
  constructor(private readonly soccerFieldService: SoccerFieldService) {}

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
  ): Promise<TimeSlot[]> {
    const date = new Date(dateStr);
    return this.soccerFieldService.getAvailability(id, date);
  }

  @Get('search')
  async searchFields(@Query() searchDto: SearchFieldsDto) {
    return this.soccerFieldService.searchFields(searchDto);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Param('id') id: number,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.soccerFieldService.createReview(id, createReviewDto);
  }

  @Get('owner/:ownerId/statistics')
  @UseGuards(JwtAuthGuard)
  async getFieldStatistics(@Param('ownerId') ownerId: number) {
    return this.soccerFieldService.getFieldStatistics(ownerId);
  }

  @Post(':id/special-hours')
  @UseGuards(JwtAuthGuard)
  async createSpecialHours(
    @Param('id') id: number,
    @Body() createSpecialHoursDto: CreateSpecialHoursDto,
  ) {
    return this.soccerFieldService.createSpecialHours(
      id,
      createSpecialHoursDto,
    );
  }

  @Get(':id/special-hours')
  async getSpecialHours(
    @Param('id') id: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.soccerFieldService.getSpecialHours(id, startDate, endDate);
  }

  @Get('owner/:ownerId')
  @UseGuards(JwtAuthGuard)
  async getFieldsByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.soccerFieldService.getFieldsByOwner(ownerId);
  }

  @Get('nearby/:lat/:lng')
  async getNearbyFields(
    @Param('lat') lat: number,
    @Param('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    if (lat === null || lng === null) {
      throw new Error('Latitud y longitud son requeridas');
    }
    if (radius !== undefined && radius < 0) {
      throw new Error('El radio debe ser mayor a 0');
    }
    return this.soccerFieldService.getNearbyFields(lat, lng, radius);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva cancha de fútbol' })
  @ApiResponse({ status: 201, description: 'Cancha creada exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'Solo propietarios pueden crear canchas',
  })
  async createField(
    @Body() createFieldDto: CreateFieldDto,
    @Req() req: RequestWithUser,
  ) {
    createFieldDto.ownerId = req.user.id;
    return await this.soccerFieldService.createField(createFieldDto);
  }
}
