import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get('PORT') || 3002;
  app.setGlobalPrefix('api/v1');

  // Swagger setup
  const configSwagger = new DocumentBuilder()
    .setTitle('Concert Service API')
    .setDescription('API documentation for the Concert Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
  console.log(`Concert service is running on: http://localhost:${port}`);
}
bootstrap();
