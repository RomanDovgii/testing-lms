// Copyright (C) 2024 Roman Dovgii
// This file is part of ProjectName.
//
// ProjectName is free software: you can redistribute it and/or modify
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

import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { TestingService } from './testing.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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
  controllers: [TestingController],
  providers: [TestingService],
})
export class TestingModule {}
