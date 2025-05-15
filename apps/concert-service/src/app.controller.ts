import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check concert service health' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'concert-service' },
        timestamp: { type: 'string', example: '2024-03-15T12:00:00.000Z' },
      },
    },
  })
  async health() {
    return {
      status: 'ok',
      service: 'concert-service',
      timestamp: new Date().toISOString(),
    };
  }
}
