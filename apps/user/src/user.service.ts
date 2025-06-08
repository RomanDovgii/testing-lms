import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
  ) { }

  private readonly basePath = '../tmp/tests';

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

  async approveProfessor(userId: number): Promise<{message: string}> {
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

  async updateUser(updateData): Promise<{success: boolean, message: string }> {
    console.log(updateData)
    const { id, ...rest } = updateData;

    if (!id) {
      return {success: false,  message: 'User ID is required' };
    }

    const user = await this.userRepo.findOne(
      {where: { id }}
    );

    if (!user) {
      return {success: false,  message: `User with ID ${id} not found` };
    }

    Object.assign(user, rest);
    await this.userRepo.save(user);

    return { success: true,  message: `User updated` };
  }
}

