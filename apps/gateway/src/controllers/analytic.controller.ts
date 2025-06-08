import { Controller, Post, Body, Inject, Get } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('analytic')
export class AnalyticController {
  constructor(
    @Inject('ANALYTIC_SERVICE') private readonly analyticClient: ClientProxy,
  ) {}

  @Get ('test')
  async test(@Body() data: any) {
    return this.analyticClient.send({ cmd: 'test' }, data);
  }
}