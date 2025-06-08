import { Body, Controller, Get, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadTestDto } from './dto/testUpload.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @MessagePattern({ cmd: 'test' })
  getTest(): object {
    return { message: 'User controller is running' };
  }

  @MessagePattern({ cmd: 'get all groups' })
  async getAllGroups() {
    return this.userService.getAllGroups();
  }

  @MessagePattern({ cmd: 'get all students' })
  async getAllStudents() {
    return this.userService.getAllStudents();
  }

  @MessagePattern({ cmd: 'get students by group' })
  async getStudentsByGroup(@Payload() groupName: string) {
    return this.userService.getStudentsByGroup(groupName);
  }

  @MessagePattern({ cmd: 'get user by Id' })
  async getUserById(@Payload() userId: number) {
    return this.userService.getUserById(userId);
  }

  @MessagePattern({ cmd: 'upload test' })
  async handleUploadTest(@Payload() payload: any) {
    return this.userService.saveTest(payload);
  }


  @MessagePattern('get all tasks by user')
  async getallTasksByUser(@Payload() ownerId: number) {
    return this.userService.getAllTasksByUser(ownerId);
  }

  @MessagePattern({ cmd: 'get all tests by user' })
  async getTestsByUser(@Payload() data: { userId: number }) {
    return await this.userService.findByUserId(data.userId);
  }

  @MessagePattern({cmd: 'get all users with available repos'})
  async getAllUsersWithAvailableRepos(){
    return await this.userService.findAllUsersWithAvailableRepos();
  }

  @MessagePattern({cmd: 'add task to check'})
  async handleToggleHtmlCopyCheck(@Payload() taskId: number): Promise<{ message: string }> {
    const message = await this.userService.toggleHtmlCopyCheck(taskId);
    return { message };
  }
}
