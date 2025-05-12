import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get('PORT') || 3002;
  await app.listen(port);
  console.log(`Concert service is running on: http://localhost:${port}`);
}
bootstrap();
