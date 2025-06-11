// Copyright (C) 2024 Roman Dovgii
// This file is part of LMS with github classroom integration.
//
// LMS with github classroom integration is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
