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

import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Groups } from './entities/group.entity';
import { Roles } from './entities/roles.entity';
import { UploadTestDto } from './dto/testUpload.dto';
import { Tasks } from './entities/tasks.entity';
import { Test } from './entities/test.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ParticipatingGithubUser } from './entities/participants.entity';
import { HtmlCopyCheck } from './entities/htmlCopyCheck.entity';
import { HtmlCopyMatch } from './entities/htmlCopyMatch.entity';
import { Anomaly } from './entities/anomaly.entity';
import { RepoStat } from './entities/repoStat.entity';
import { ValidationResult } from './entities/validation-results.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Groups)
    private readonly groupRepo: Repository<Groups>,

    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,

    @InjectRepository(Test)
    private testRepo: Repository<Test>,

    @InjectRepository(Tasks)
    private taskRepo: Repository<Tasks>,


    @InjectRepository(ParticipatingGithubUser)
    private participantsRepo: Repository<ParticipatingGithubUser>,

    @InjectRepository(HtmlCopyCheck)
    private HtmlCopyCheckRepo: Repository<HtmlCopyCheck>,

    @InjectRepository(HtmlCopyMatch)
    private HtmlCopyMatchRepo: Repository<HtmlCopyMatch>,

    @InjectRepository(Anomaly)
    private AnomalyRepo: Repository<Anomaly>,

    @InjectRepository(RepoStat)
    private RepoStatRepo: Repository<RepoStat>,

    @InjectRepository(ValidationResult)
    private ValidationResultRepo: Repository<ValidationResult>,
  ) { }

  private isWindows = process.platform === 'win32';
  private readonly basePath = this.isWindows
    ? path.join('C:\\', 'tmp', 'repos')
    : path.resolve('/', 'tmp', 'repos');


  async getAllGroups(): Promise<Groups[]> {
    return await this.groupRepo.find();
  }

  async getAllStudents(): Promise<User[]> {
    return await this.userRepo.find({
      where: {
        role: {
          name: Not(In(['преподаватель', 'администартор', 'наставник'])),
        },
      },
      relations: ['role']
    })
  }

  async getUserById(userId: number): Promise<any> {
    const user = await this.userRepo.findOne({
      where: {
        id: userId
      },
      relations: ['role']
    })

    return {
      id: user?.id,
      name: user?.name,
      surname: user?.surname,
      github: user?.github,
      group: user?.group?.name,
      role: user?.role?.name,
    }
  }

  async getStudentsByGroup(groupName: string): Promise<User[]> {
    return this.userRepo.find({
      where: {
        group: { name: groupName },
        role: { name: 'студент' },
      },
      relations: ['role', 'group'],
    });
  }

  async getAllProfessors(): Promise<User[]> {
    return await this.userRepo.find({
      where: {
        role: {
          name: 'преподаватель',
        },
      }
    })
  }

  async updateTeacherActiveStatus(userId: number, isActive: boolean): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role.name !== 'преподаватель') {
      throw new BadRequestException('Пользователь не является преподавателем');
    }

    user.isActive = isActive;
    return this.userRepo.save(user);
  }

  async saveTest(dto: {
    userId: number;
    title: string;
    description: string;
    taskIds: number[];
    originalFilename: string;
    fileBuffer: string;
  }): Promise<Test> {
    const buffer = Buffer.from(dto.fileBuffer, 'base64');

    const userDir = path.join(this.basePath, String(dto.userId));
    await fs.mkdir(userDir, { recursive: true });

    const filePath = path.join(userDir, dto.originalFilename);
    await fs.writeFile(filePath, buffer);

    const user = await this.userRepo.findOneOrFail({ where: { id: dto.userId } });

    let tasks: Tasks[] = [];
    if (dto.taskIds && dto.taskIds.length > 0) {
      tasks = await this.taskRepo.findBy({
        id: In(dto.taskIds),
      });
    }

    const test = this.testRepo.create({
      title: dto.title,
      description: dto.description,
      filename: dto.originalFilename,
      filepath: filePath,
      uploadedBy: user,
      tasks: tasks.length > 0 ? tasks : undefined,
    });

    await this.testRepo.save(test);
    return test;
  }

  async getAllTasksByUser(ownerId: number): Promise<Tasks[]> {
    return this.taskRepo.find({
      where: {
        owner: {
          id: ownerId
        },
      },
      relations: ['htmlCopyMatches', 'anomalies', 'htmlCopyChecks']
    })
  }

  async findByUserId(userId: number): Promise<Test[]> {
    return this.testRepo
      .createQueryBuilder('test')
      .leftJoinAndSelect('test.tasks', 'task')
      .where('test.uploadedBy = :userId', { userId })
      .getMany();
  }

  async findAllUsersWithAvailableRepos(): Promise<ParticipatingGithubUser[]> {
    return this.participantsRepo.find();
  }

  async toggleHtmlCopyCheck(taskId: number): Promise<string> {

    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['htmlCopyChecks'],
    });

    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    let htmlCopyCheck = task.htmlCopyChecks[0];
    let message: string;

    if (htmlCopyCheck) {
      htmlCopyCheck.enabled = !htmlCopyCheck.enabled;
      await this.HtmlCopyCheckRepo.save(htmlCopyCheck);
      message = 'HtmlCopyCheck updated';
    } else {
      htmlCopyCheck = this.HtmlCopyCheckRepo.create({
        task: task,
        enabled: true,
      });
      await this.HtmlCopyCheckRepo.save(htmlCopyCheck);
      message = 'HtmlCopyCheck created';
    }

    return message;
  }

  async getTasksByGithubLogin(githubLogin: string): Promise<Tasks[]> {

    const participants = await this.participantsRepo.find({ where: { githubLogin } });
    if (participants.length === 0) return [];

    const taskIds = Array.from(new Set(participants.map(p => p.taskId)));

    if (taskIds.length === 0) return [];

    const tasks = await this.taskRepo.createQueryBuilder('task')
      .where('task.taskId IN (:...taskIds)', { taskIds })
      .getMany();

    return tasks;
  }

  async getUnapprovedProfessors(): Promise<User[]> {
    return this.userRepo.find({
      where: { isActive: false },
    });
  }

  async approveProfessor(userId: number): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error(`Пользователь с id ${userId} не найден`);
    }

    user.isActive = true;
    await this.userRepo.save(user);

    return {
      message: `пользователь ${user.name} ${user.surname}  одобрен`
    }
  }

  async updateUser(updateData): Promise<{ success: boolean, message: string }> {
    console.log(updateData)
    const { id, ...rest } = updateData;

    if (!id) {
      return { success: false, message: 'User ID is required' };
    }

    const user = await this.userRepo.findOne(
      { where: { id } }
    );

    if (!user) {
      return { success: false, message: `User with ID ${id} not found` };
    }

    Object.assign(user, rest);
    await this.userRepo.save(user);

    return { success: true, message: `User updated` };
  }

  async deleteTask(taskId): Promise<{ success: boolean, message: string }> {
    let task: Tasks | null;

    try {
      task = await this.taskRepo.findOne({
        where: { id: taskId },
        relations: [],
      });

      if (!task) {
        throw new NotFoundException(`Task with id ${taskId} not found`);
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to fetch task: ${error.message}`);
    }

    try {
      await this.HtmlCopyCheckRepo.delete({ task: { id: taskId } });
      await this.HtmlCopyMatchRepo.delete({ task: { id: taskId } });
      await this.participantsRepo.delete({ taskId: task.taskId.toString() });
      await this.AnomalyRepo.delete({ task: { id: taskId } })
      await this.RepoStatRepo.delete({ task: { id: taskId } })
      await this.ValidationResultRepo.delete({ task: { id: taskId } })
    } catch (error) {
      return {
        success: false,
        message: `tables connected to task with id ${taskId} wasn't successfully deleted`
      }
    }

    try {
      const testsWithThisTask = await this.testRepo.find({ where: {}, relations: ['tasks'] });

      for (const test of testsWithThisTask) {
        if (test.tasks?.some(t => t.id === taskId)) {
          test.tasks = test.tasks.filter(t => t.id !== taskId);
          await this.testRepo.save(test);
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `tests connected to task with id ${taskId} wasn't successfully deleted`
      }
    }


    try {
      const task = await this.taskRepo.findOne({ where: { id: taskId } });

      if (task?.taskId) {
        await this.deleteTaskDirectory(task.taskId, task.branch);
      }

      const result = await this.taskRepo.delete(taskId);

      if (result.affected === 0) {
        return {
          success: false,
          message: `Task with id ${taskId} was not found or already deleted`,
        };
      }

      return {
        success: true,
        message: `Task with id ${taskId} deleted`,
      };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        message: `Task with id ${taskId} wasn't successfully deleted`,
      };
    }
  }

  async updateTask(body: {
    id: number;
    userId: number;
    name?: string;
    link?: string;
    branch?: string;
    taskId?: number;
    ownerId?: number;
  }): Promise<{ success: boolean; message: string }> {
    const task = await this.taskRepo.findOne({
      where: { id: body.id },
      relations: ['owner'],
    });

    console.log('я работаю', task)
    console.log(body);

    if (!task) {
      return { success: false, message: `Task with id ${body.id} not found` };
    }

    if (!task.owner || task.owner.id !== body.userId) {
      return { success: false, message: `Access denied: you are not the owner of this task` };
    }

    const oldTaskId = task.taskId ?? task.id;
    const oldBranch = task.branch;

    let taskIdChanged = false;
    let branchChanged = true;

    if (body.name) task.name = body.name;
    if (body.link) task.link = body.link;
    if (body.branch && body.branch !== task.branch) {
      task.branch = body.branch;
      branchChanged = true;
    }

    if (body.taskId !== undefined && body.taskId !== task.taskId) {
      task.taskId = body.taskId;
      taskIdChanged = true;
    }

    if (body.ownerId && body.ownerId !== task.owner.id) {
      const newOwner = await this.userRepo.findOne({ where: { id: body.ownerId } });
      if (!newOwner) {
        return { success: false, message: `New owner with id ${body.ownerId} not found` };
      }
      task.owner = newOwner;
    }

    try {
      await this.taskRepo.save(task);

      if (taskIdChanged || branchChanged) {
        await this.deleteTaskDirectory(oldTaskId, oldBranch);
      }

      return { success: true, message: 'Task updated successfully' };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, message: 'Error updating task' };
    }
  }

  private async deleteTaskDirectory(taskId: number, branch: string) {
    const dirPath = path.join(this.basePath, taskId.toString(), branch);

    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      console.log(`Deleted directory: ${dirPath}`);
    } catch (err) {
      console.error(`Failed to delete directory: ${dirPath}`, err);
    }
  }

  async deleteTest(testId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const test = await this.testRepo.findOne({
      where: { id: testId },
      relations: ['uploadedBy', 'tasks'],
    });

    if (!test) {
      return { success: false, message: `Test with id ${testId} not found` };
    }

    if (!test.uploadedBy || test.uploadedBy.id !== userId) {
      return { success: false, message: `Access denied: you are not the owner of this test` };
    }

    try {
      if (test.tasks && test.tasks.length > 0) {
        test.tasks = [];
        await this.testRepo.save(test);
      }

      try {
        await fs.unlink(test.filepath);
        console.log(`Deleted file: ${test.filepath}`);
      } catch (err) {
        console.warn(`File not found or already deleted: ${test.filepath}`);
      }

      await this.testRepo.remove(test);

      return { success: true, message: 'Test deleted successfully' };
    } catch (error) {
      console.error('Error deleting test:', error);
      return { success: false, message: 'Error deleting test' };
    }
  }

  async updateTest(body: {
    testId: number;
    userId: number;
    title?: string;
    description?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { testId, userId, title, description } = body;

    const test = await this.testRepo.findOne({
      where: { id: testId },
      relations: ['uploadedBy'],
    });

    if (!test) {
      return { success: false, message: `Test with id ${testId} not found` };
    }

    if (!test.uploadedBy || test.uploadedBy.id !== userId) {
      return { success: false, message: `Access denied: you are not the owner of this test` };
    }

    if (title) test.title = title;
    if (description) test.description = description;

    try {
      await this.testRepo.save(test);
      return { success: true, message: 'Test updated successfully' };
    } catch (error) {
      console.error('Error updating test:', error);
      return { success: false, message: 'Error updating test' };
    }
  }
}

