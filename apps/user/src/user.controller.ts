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

import { Body, Controller, Get, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadTestDto } from './dto/testUpload.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DeleteTestDto } from './dto/delete-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

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

  @MessagePattern({ cmd: 'get all users with available repos' })
  async getAllUsersWithAvailableRepos() {
    return await this.userService.findAllUsersWithAvailableRepos();
  }

  @MessagePattern({ cmd: 'add task to check' })
  async handleToggleHtmlCopyCheck(@Payload() taskId: number): Promise<{ message: string }> {
    const message = await this.userService.toggleHtmlCopyCheck(taskId);
    return { message };
  }

  @MessagePattern({ cmd: 'get student tasks' })
  async getStudentTasks(@Payload() githubLogin: string): Promise<any[]> {
    return await this.userService.getTasksByGithubLogin(githubLogin);
  }

  @MessagePattern({ cmd: 'get unapproved' })
  async getUnapprovedProfessors() {
    return await this.userService.getUnapprovedProfessors();
  }



  @MessagePattern({ cmd: 'approve professor' })
  async approveProfessor(@Payload() professorId: number): Promise<{ message: string }> {
    return await this.userService.approveProfessor(professorId);
  }

  @MessagePattern({ cmd: 'update user profile' })
  async updateUserProfile(updateData: any) {
    return await this.userService.updateUser(updateData);
  }

  @MessagePattern({ cmd: 'delete task' })
  async deleteTask(@Payload() payload: { taskId: number }): Promise<{ success: boolean; message: string }> {
    const { taskId } = payload;
    const message = await this.userService.deleteTask(taskId);
    return message;
  }

  @MessagePattern({ cmd: 'update task' })
  async updateTask(@Payload() dto: UpdateTaskDto) {
    return this.userService.updateTask(dto);
  }

  @MessagePattern({ cmd: 'delete test' })
  async deleteTest(@Payload() dto: DeleteTestDto) {
    return this.userService.deleteTest(dto.testId, dto.userId);
  }

  @MessagePattern({ cmd: 'update test' })
  async updateTest(@Payload() dto: UpdateTestDto) {
    return this.userService.updateTest(dto);
  }
}
