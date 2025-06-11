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

import { Module } from '@nestjs/common';
import { AuthorizationController } from './authorization.controller';
import { AuthorizationService } from './authorization.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { Groups } from './entities/group.entity';
import { Roles } from './entities/roles.entity';
import { Anomaly } from './entities/anomaly.entity';
import { HtmlCopyCheck } from './entities/htmlCopyCheck.entity';
import { HtmlCopyMatch } from './entities/htmlCopyMatch.entity';
import { Tasks } from './entities/tasks.entity';
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
          entities: [User, Groups, Roles, Anomaly, HtmlCopyCheck, HtmlCopyMatch, Tasks, Test],
          synchronize: true,
        }),
    TypeOrmModule.forFeature([User, Groups, Roles, Anomaly, HtmlCopyCheck, HtmlCopyMatch, Tasks, Test]),
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_for_development',
      signOptions: {expiresIn: '10h'}
    })
  ],
  controllers: [AuthorizationController],
  providers: [AuthorizationService],
})
export class AuthorizationModule {}
