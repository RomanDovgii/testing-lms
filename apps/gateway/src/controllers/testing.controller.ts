import { Controller, Post, Body, Inject, Get } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('testing')
export class TestingController {
  constructor(
    @Inject('TESTING_SERVICE') private readonly testingClient: ClientProxy,
  ) {}

  @Get ('test')
  async test(@Body() data: any) {
    return this.testingClient.send({ cmd: 'test' }, data);
  }
}