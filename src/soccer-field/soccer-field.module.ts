import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoccerFieldController } from './soccer-field.controller';
import { SoccerFieldService } from './soccer-field.service';
import { SoccerField } from './entities/soccer-field.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SoccerField])],
  controllers: [SoccerFieldController],
  providers: [SoccerFieldService],
  exports: [SoccerFieldService],
})
export class SoccerFieldModule {} 