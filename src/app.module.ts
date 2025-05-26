import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoccerFieldModule } from './soccer-field/soccer-field.module';
import { AuthModule } from './auth/auth.module';
import { SoccerField } from './soccer-field/entities/soccer-field.entity';
import { EventsGateway } from './events/events.gateway';

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
    SoccerFieldModule,
    AuthModule,
  ],
  providers: [EventsGateway],
})
export class AppModule {}
