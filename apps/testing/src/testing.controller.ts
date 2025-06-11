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
import { TestingService } from './testing.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskDto } from './dto/task.dto';
import { ValidateRequest } from './dto/test-layout-request.dto';

@Controller()
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @MessagePattern({ cmd: 'test' })
  getTest(): object {
    return {message: 'Testing controller is running'};
  }

  @MessagePattern({ cmd: 'add task' })
  addTask(dto: TaskDto): object {
    return this.testingService.addTask(dto);
  }

  @MessagePattern({ cmd: 'validate-html' })
  async handleValidateHtml(@Payload() data: { githubLogin: string; taskId: number }) {
    const { githubLogin, taskId } = data;
    return this.testingService.validateStudentRepo(githubLogin, taskId);
  }

  @MessagePattern({ cmd: 'get anomalies' })
  async getAnomalies() {
    return this.testingService.getAnomalies();
  }

  @MessagePattern({ cmd: 'get copies' })
  async getCopies() {
    return this.testingService.getCopies();
  }

  @MessagePattern({cmd: 'run test'})
  async handleRunTest(@Payload() data: { testId: number }) {
    if (!data || typeof data.testId !== 'number') {
      throw new Error('Invalid payload: testId is required and must be a number');
    }
    return this.testingService.runAndSaveTestResults(data.testId);
  }

  @MessagePattern({cmd: 'run test for student'})
  async handleStudenRunTest(@Payload() data: { taskId: number, githubLogin: string }) {
    if (!data || typeof data.taskId !== 'number') {
      throw new Error('Invalid payload: testId is required and must be a number');
    }

    if (!data || typeof data.githubLogin !== 'string') {
      throw new Error('Invalid payload: githubLogin is required and must be a string');
    }
    return this.testingService.runStudentTest(data.taskId, data.githubLogin);
  }
}
