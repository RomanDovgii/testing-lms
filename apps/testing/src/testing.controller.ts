import { Controller, Get } from '@nestjs/common';
import { TestingService } from './testing.service';

@Controller()
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get()
  getHello(): string {
    return this.testingService.getHello();
  }
}
