import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  });
  const configService = app.get(ConfigService);

  // Configuración de CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configuración de WebSockets
  app.useWebSocketAdapter(new CustomIoAdapter(app));

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // límite de 100 peticiones por ventana
      message: 'Too many requests from this IP, please try again later.'
    })
  );

  // Middleware de seguridad
  app.use(helmet());
  app.use(compression());

  // Límites de payload
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false }));

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Soccer Field API')
    .setDescription('API para gestión de canchas de fútbol')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health Check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  // Manejo de señales para apagado graceful
  const signals = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`${signal} signal received: closing HTTP server`);
      await app.close();
      console.log('HTTP server closed');
      process.exit(0);
    });
  }

  // Iniciar servidor
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${configService.get('NODE_ENV') || 'development'}`);
  console.log(`Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
