import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoccerFieldModule } from './soccer-field/soccer-field.module';
import { AuthModule } from './auth/auth.module';
import { SoccerField } from './soccer-field/entities/soccer-field.entity';
import { EventsGateway } from './events/events.gateway';
import { Field } from './soccer-field/entities/field.entity';
import { Booking } from './bookings/entities/booking.entity';
import { SoccerFieldController } from './soccer-field/soccer-field.controller';
import { SoccerFieldService } from './soccer-field/soccer-field.service';
import { BookingController } from './bookings/booking.controller';
import { BookingService } from './bookings/booking.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [SoccerField],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Field, Booking]),
    SoccerFieldModule,
    AuthModule,
  ],
  controllers: [AppController, SoccerFieldController, BookingController],
  providers: [EventsGateway, SoccerFieldService, BookingService],
})
export class AppModule {}
