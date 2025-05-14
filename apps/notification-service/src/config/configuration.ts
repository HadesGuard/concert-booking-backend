import { registerAs } from '@nestjs/config';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fallback: string;
}

export interface NotificationConfig {
  redisUrl: string;
  smtp: SmtpConfig;
}

const configuration = (): NotificationConfig => ({
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || '',
    fallback: process.env.MAIL_FALLBACK || 'errors@yourdomain.com',
  },
});

export default registerAs('notification', configuration); 