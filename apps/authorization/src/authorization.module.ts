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
