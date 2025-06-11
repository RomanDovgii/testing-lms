// Copyright (C) 2024 Roman Dovgii
// This file is part of ProjectName.
//
// ProjectName is free software: you can redistribute it and/or modify
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