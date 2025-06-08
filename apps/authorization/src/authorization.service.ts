import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Roles } from './entities/roles.entity';
import { Groups } from './entities/group.entity';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Groups)
    private groupRepo: Repository<Groups>,

    @InjectRepository(Roles)
    private roleRepo: Repository<Roles>,

    private httpService: HttpService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const { name, surname, group, email, password, github, isProfessor } = dto;

    const localEmail = email;
    const isExisting = await this.userRepo.findOne({ where: { email } });
    if (isExisting) return { message: 'User already exists' };
    const isExistingGithub = await this.userRepo.findOne({ where: { github } });
    if (isExistingGithub) return { message: 'User already exists' };

    let isGithubExisting = false;

    if (github) {
      try {
        const response = await this.httpService.axiosRef.get(`https://api.github.com/users/${github}`)
        isGithubExisting = response.status === 200;
      }
      catch (err) {
        isGithubExisting = false;
      }
    }

    if (!isGithubExisting) return { message: 'Github page does not exist' };

    const passwordHash = await bcrypt.hash(password, 10);

    let groupEntity = await this.groupRepo.findOne({ where: { name: group } });

    if (!groupEntity) {
      groupEntity = this.groupRepo.create({ name: group });
      await this.groupRepo.save(groupEntity);
      groupEntity = await this.groupRepo.findOne({ where: { name: group } });
    }

    const studentRoleEntity = await this.roleRepo.findOne({where: {name: "студент"}});
    const professorRoleEntity = await this.roleRepo.findOne({where: {name: "преподаватель"}});

    if (!studentRoleEntity || !professorRoleEntity) {
      return { message: "Ошибка подключения к базе таблице ролей" };
    }
    
    const currentRole = isProfessor ? professorRoleEntity : studentRoleEntity;

    console.log(currentRole)

    const user = this.userRepo.create({
      email: localEmail,
      password: passwordHash,
      name: name,
      surname: surname,
      group: groupEntity || undefined,
      role: currentRole,
      github: github,
      isActive: isProfessor ? false : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.userRepo.save(user);
    return { message: "пользователь зарегистрирован" }
  }

  async login(dto: LoginDto) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const { identifier, password } = dto;
    let user;

    if (emailRegex.test(identifier)) {
      user = await this.userRepo.findOne({
        where: [
          { email: identifier }
        ],
      });
    } else {
      user = await this.userRepo.findOne({
        where: [
          { github: identifier }
        ],
      });
    }

    const role = user?.role?.name;

    console.log(user)

    if (!user) {
      return {message: "user does not exist"}
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) return {message: "password is not valid"}

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: role,
      username: `${user.name} ${user.surname}`
    })

    return {accessToken: token}
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
