import { Controller, Get } from '@nestjs/common';
import { AnalyticService } from './analytic.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AnalyticController {
  constructor(private readonly analyticService: AnalyticService) {}

  @MessagePattern({ cmd: 'test' })
  getTest(): object {
    return {message: 'Analytic controller is running'};
  }
}
