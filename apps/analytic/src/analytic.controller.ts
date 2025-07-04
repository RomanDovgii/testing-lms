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
