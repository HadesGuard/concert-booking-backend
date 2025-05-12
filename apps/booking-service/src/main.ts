import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get('PORT') || 3001;
  await app.listen(port);
  console.log(`Booking service is running on: http://localhost:${port}`);
}
bootstrap();
