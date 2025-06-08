import { Controller, Get } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @MessagePattern({ cmd: 'test' })
  getTest(): object {
    return { message: 'Authorization controller is running' };
  };

  @MessagePattern({ cmd: 'register' })
  registerUser(dto: RegisterDto): object {
    return this.authorizationService.register(dto);
  };

  @MessagePattern({ cmd: 'login' })
  loginUser(dto: LoginDto): object {
    return this.authorizationService.login(dto);
  };

  @MessagePattern({cmd: 'verify-token'})
  verifyToken(dto: string) {
    return this.authorizationService.verifyToken(dto);
  }
}
