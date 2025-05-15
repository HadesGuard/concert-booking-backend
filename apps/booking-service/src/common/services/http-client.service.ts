import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceAuthService } from '../../modules/auth/auth.service';

@Injectable()
export class HttpClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly serviceAuthService: ServiceAuthService,
  ) {}

  async get<T>(url: string, timeout = 5000): Promise<T> {
    try {
      const token = await this.serviceAuthService.getServiceToken();
      
      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          timeout,
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Service-Name': 'booking-service'
          }
        })
      );
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          throw new BadRequestException('Service request timed out');
        }
        if (error.response?.status === 404) {
          throw new NotFoundException('Resource not found', url);
        }
        if (error.response?.status === 401) {
          throw new BadRequestException('Service authentication failed');
        }
      }
      throw new BadRequestException('Service unavailable', url);
    }
  }
} 