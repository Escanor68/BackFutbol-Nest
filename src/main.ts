import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor global de logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('TurnosYa Backend API')
    .setDescription(
      'API para gestión de canchas de fútbol y reservas deportivas',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('app', 'Endpoints principales')
    .addTag('auth', 'Autenticación y autorización')
    .addTag('users', 'Gestión de usuarios')
    .addTag('fields', 'Gestión de canchas')
    .addTag('bookings', 'Gestión de reservas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🏟️ TurnosYa Backend ejecutándose en puerto ${port}`);
  console.log(`📖 Documentación Swagger: http://localhost:${port}/api`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
