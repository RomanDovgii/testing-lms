import { Controller, Get } from '@nestjs/common';
import { AnalyticService } from './analytic.service';

@Controller()
export class AnalyticController {
  constructor(private readonly analyticService: AnalyticService) {}

  @Get()
  getHello(): string {
    return this.analyticService.getHello();
  }
}
