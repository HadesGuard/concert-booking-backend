import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService implements OnModuleInit {
  private redis: Redis;

  constructor(
    private configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('notification.redisUrl');
    const smtpConfig = this.configService.get('notification.smtp');
    this.redis = new Redis(redisUrl);

    console.log('Notification Service started. Waiting for booking events...');

    this.redis.subscribe('booking-events', (err, count) => {
      if (err) {
        console.error('Failed to subscribe: ', err);
      } else {
        console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
      }
    });

    this.redis.on('message', async (channel, message) => {
      if (channel === 'booking-events') {
        const event = JSON.parse(message);
        if (event.type === 'booking.created') {
          const userEmail = event.data.email || smtpConfig.fallback;
          if (!event.data.email) {
            console.warn(`[EMAIL][FALLBACK] Booking thiếu email, gửi về ${userEmail}. BookingId: ${event.data.bookingId}`);
          }
          try {
            await this.mailerService.sendMail({
              to: userEmail,
              subject: 'Booking Confirmation',
              text: `Your booking for concert ${event.data.concertId} (seat type: ${event.data.seatTypeId}) is confirmed!`,
              // html: '<b>Your booking is confirmed!</b>',
            });
            console.log(`[EMAIL] Đã gửi email xác nhận booking cho ${userEmail}`);
          } catch (err) {
            console.error('[EMAIL] Lỗi gửi email:', err);
          }
        }
      }
    });
  }
} 