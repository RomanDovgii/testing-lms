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

import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { TaskDto } from './dto/task.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';
import { firstValueFrom } from 'rxjs';
import { DeleteTestDto } from './dto/delete-test.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTHORIZATION_SERVICE') private readonly authorizationClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('ANALYTIC_SERVICE') private readonly analyticClient: ClientProxy,
    @Inject('TESTING_SERVICE') private readonly testingClient: ClientProxy,
  ) { }

  // tests for microservices
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() request) {
    const user = request.user;
  }

  @Get()
  async runGatewayTest() {
    return { message: 'Gateway controller is running' };
  }
  @UseGuards(JwtAuthGuard)
  @Get('authorization/test')
  async runAuthorizationTest() {
    return this.authorizationClient.send({ cmd: 'test' }, {});
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/test')
  @Roles('студент')
  async runUserTest() {
    return this.userClient.send({ cmd: 'test' }, {});
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/get-user')
  async getUserById(@Req() request) {
    const userId = request.user.sub;
    return this.userClient.send({ cmd: 'get user by Id' }, userId);
  }

  @Get('analytic/test')
  async runAnalyticTest() {
    return this.analyticClient.send({ cmd: 'test' }, {});
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('testing/test')
  @Roles('администратор')
  async runTestingTest() {
    return this.testingClient.send({ cmd: 'test' }, {});
  }

  // Authorization

  @Post('authorization/register')
  async registerUser(@Body() dto: RegisterDto) {
    return this.authorizationClient.send({ cmd: 'register' }, dto);
  }

  @Post('authorization/login')
  async loginUser(@Body() dto: LoginDto) {
    return this.authorizationClient.send({ cmd: 'login' }, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('testing/add-task')
  @Roles('преподаватель')
  async addTask(
    @Body() dto: TaskDto,
  ) {
    return this.testingClient.send({ cmd: 'add task' }, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('testing/validate-html')
  @Roles('преподаватель', 'студент')
  async validateHtml(@Body() body: { githubLogin: string; taskId: number }) {
    return this.testingClient.send(
      { cmd: 'validate-html' },
      body,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('testing/get-anomalies')
  @Roles('преподаватель', 'студент')
  async getAllAnomalies() {
    return this.testingClient.send(
      {
        cmd: 'get anomalies'
      },
      {}
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('testing/get-copies')
  @Roles('преподаватель', 'студент')
  async getAllCopies() {
    return this.testingClient.send(
      {
        cmd: 'get copies'
      },
      {}
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('user/upload-test')
  @Roles('преподаватель')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTest(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const fileBase64 = file.buffer.toString('base64');

    if (typeof body.taskIds === 'string') {
      try {
        body.taskIds = JSON.parse(body.taskIds);
      } catch {
        body.taskIds = [];
      }
    }

    const payload = {
      userId: body.userId,
      title: body.title,
      description: body.description,
      taskIds: body.taskIds,
      originalFilename: file.originalname,
      fileBuffer: fileBase64,
    };

    return this.userClient.send({ cmd: 'upload test' }, payload).toPromise();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/tasks')
  @Roles('преподаватель')
  async getUserTasks(@Param('id') id: string) {
    const ownerId = parseInt(id);
    return firstValueFrom(this.userClient.send('get all tasks by user', ownerId));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/:userId/tests')
  @Roles('преподаватель')
  async getTestsByUserId(@Param('userId') userId: string) {
    return await firstValueFrom(
      this.userClient.send({ cmd: 'get all tests by user' }, { userId: Number(userId) }),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/participants')
  @Roles('преподаватель')
  async getAllUsersWithAvailableRepos() {
    return await firstValueFrom(
      this.userClient.send({ cmd: 'get all users with available repos' }, {}),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('testing/run/:id')
  @Roles('преподаватель')
  async runTest(@Param('id', ParseIntPipe) testId: number) {
    return this.testingClient.send({ cmd: 'run test' }, { testId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/user/add-check/:id')
  @Roles('преподаватель')
  async addTaskCheck(@Param('id') id: string) {
    const taskId = parseInt(id);
    return this.userClient.send({ cmd: 'add task to check' }, taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/user/get-tasks/:githubLogin')
  @Roles('студент')
  async getStudentTasks(@Param('githubLogin') githubLogin: string) {
    return this.userClient.send({ cmd: 'get student tasks' }, githubLogin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('testing/student-run/:id/:githubLogin')
  @Roles('студент')
  async runStudentTest(@Param('id', ParseIntPipe) taskId: number, @Param('githubLogin') githubLogin: string) {
    return this.testingClient.send({ cmd: 'run test for student' }, { taskId, githubLogin });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/user/unapproved')
  @Roles('администратор')
  async getUnapprovedProfessors() {
    return this.userClient.send({ cmd: 'get unapproved' }, {});
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/user/approve/:id')
  @Roles('администратор')
  async approveProfessor(@Param('id') id: string) {
    const taskId = parseInt(id);
    return this.userClient.send({ cmd: 'approve professor' }, taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/user/update')
  @Roles('администратор', 'преподаватель', 'студент')
  async updateProfile(@Body() updateUserDto: any) {
    return this.userClient.send({ cmd: 'update user profile' }, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/user/task/delete')
  @Roles('преподаватель')
  async deleteTask(@Body() body: {taskId: number}) {
    return this.userClient.send({ cmd: 'delete task' }, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('user/task/update')
  @Roles('преподаватель')
  async updateTask(@Body() dto: UpdateTaskDto) {
    return this.userClient.send({ cmd: 'update task' }, dto);
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('user/test/delete')
  @Roles('преподаватель')
  async deleteTest(@Body() dto: DeleteTestDto) {
    return this.userClient.send({ cmd: 'delete test' }, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('user/test/update')
  @Roles('преподаватель')
  async updateTest(@Body() dto: UpdateTestDto) {
    return this.userClient.send({ cmd: 'update test' }, dto);
  }
}
