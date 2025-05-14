import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import notificationConfig from '../config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [notificationConfig],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const smtp = configService.get('notification.smtp');
        return {
          transport: {
            host: smtp.host,
            port: smtp.port,
            auth: {
              user: smtp.user,
              pass: smtp.pass,
            },
          },
          defaults: {
            from: smtp.from,
          },
        };
      },
    }),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {} 