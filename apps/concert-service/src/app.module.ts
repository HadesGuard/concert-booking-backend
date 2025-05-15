import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConcertsModule } from './modules/concerts/concerts.module';
import { SeatTypeModule } from './modules/seat-types/seat-types.module';
import * as path from 'path';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), 'apps/concert-service/.env'),
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('concert.database.uri'),
      }),
    }),
    ConcertsModule,
    SeatTypeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
