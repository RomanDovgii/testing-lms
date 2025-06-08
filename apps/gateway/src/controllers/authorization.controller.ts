import { Controller, Post, Body, Inject, Get } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterDto } from '../dto/register.dto';

@Controller('authorization')
export class AuthorizationController {
  constructor(
    @Inject('AUTHORIZATION_SERVICE') private readonly authorizationClient: ClientProxy,
  ) {}

  @Get ('test')
  async test(@Body() data: any) {
    return this.authorizationClient.send({ cmd: 'test' }, data);
  }

  @Post ('register')
  async register(@Body() dto: RegisterDto) {
    return this.authorizationClient.send({ cmd: 'register' }, dto)
  }
}