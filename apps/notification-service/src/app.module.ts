import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import notificationConfig from './config/configuration';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [notificationConfig],
    }),
    NotificationModule,
  ],
})
export class AppModule {} 