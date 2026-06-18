import 'dotenv/config'; // Cargar variables de entorno
process.env.TZ = 'America/Lima'; // Configurar zona horaria local

// Evitar que excepciones y promesas no capturadas (como errores de encriptacion de Baileys) tumben el servidor
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection] Promesa no capturada en:', promise, 'razon:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException] Excepcion no capturada:', error);
});

import { NestFactory } from '@nestjs/core'; // Force Rebuild 5
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://jhasmany-frontend.onrender.com',
      'https://jhasmany.com',
      'https://www.jhasmany.com',
      'https://jeriko1902.com',
      'https://www.jeriko1902.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3001'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  // Serve static files from uploads folder
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Backend is running on: ${await app.getUrl()}`);
  console.log('Force Restart Triggered 27: ' + new Date().toISOString());
}
bootstrap();
 
