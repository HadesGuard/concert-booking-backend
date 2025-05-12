import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

const envPath = path.join(process.cwd(), 'apps/auth-service/.env');
console.log('Current working directory:', process.cwd());
console.log('Looking for .env file at:', envPath);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envPath,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
