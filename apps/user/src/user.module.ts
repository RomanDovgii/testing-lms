import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Roles } from './entities/roles.entity';
import { Groups } from './entities/group.entity';
import { Tasks } from './entities/tasks.entity';
import { Test } from './entities/test.entity';
import { RepoStat } from './entities/repoStat.entity';
import { Anomaly } from './entities/anomaly.entity';
import { HtmlCopyMatch } from './entities/htmlCopyMatch.entity';
import { HtmlCopyCheck } from './entities/htmlCopyCheck.entity';
import { ValidationResult } from './entities/validation-results.entity';
import { ParticipatingGithubUser } from './entities/participants.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
          type: 'postgres',
          host: '192.168.1.3',
          port: 5432,
          username: 'admin',
          password: '89037839344Rd',
          database: 'student_testing_db',
          entities: [User, Tasks, RepoStat, Anomaly, HtmlCopyCheck, HtmlCopyMatch, ValidationResult, Groups, Roles, Test, ParticipatingGithubUser],
          synchronize: true,
        }),
    TypeOrmModule.forFeature([User, Tasks, RepoStat, Anomaly, HtmlCopyCheck, HtmlCopyMatch, ValidationResult, Groups, Roles, Test, ParticipatingGithubUser]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
