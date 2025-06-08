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
