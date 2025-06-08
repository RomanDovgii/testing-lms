import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { GitSyncService } from './gitsync.service';
import { User } from './entities/user.entity';
import { Tasks } from './entities/tasks.entity';
import { RepoStat } from './entities/repoStat.entity';
import { Anomaly } from './entities/anomaly.entity';
import { HtmlCopyMatch } from './entities/htmlCopyMatch.entity';
import { HtmlCopyCheck } from './entities/htmlCopyCheck.entity';
import { ValidationResult } from './entities/validation-results.entity';
import { Groups } from './entities/group.entity';
import { Roles } from './entities/roles.entity';
import { ParticipatingGithubUser } from './entities/participants.entity';
import { TestResult } from './entities/test-result.entity';
import { Test } from './entities/test.entity';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'admin',
          password: '89037839344Rd',
          database: 'student_testing_db',
          entities: [User, Tasks, RepoStat, Anomaly, HtmlCopyCheck, HtmlCopyMatch, ValidationResult, Groups, Roles, ParticipatingGithubUser, TestResult, ValidationResult, Test],
          synchronize: true,
        }),
    TypeOrmModule.forFeature([User, Tasks, RepoStat, Anomaly, HtmlCopyCheck, HtmlCopyMatch, ValidationResult, Groups, Roles, ParticipatingGithubUser, TestResult, ValidationResult, Test]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CronController],
  providers: [CronService, GitSyncService],
})
export class CronModule {}