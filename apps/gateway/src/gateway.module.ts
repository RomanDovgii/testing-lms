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
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthorizationController } from './controllers/authorization.controller';
import { UserController } from './controllers/user.controller';
import { TestingController } from './controllers/testing.controller';
import { AnalyticController } from './controllers/analytic.controller';
import { GatewayController } from './gateway.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    JwtModule.register({
          secret: process.env.JWT_SECRET || 'super_secret_jwt_for_development',
          signOptions: {expiresIn: '10h'}
    }),
    ClientsModule.register([
      {
        name: 'AUTHORIZATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5001,
        }
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5002,
        }
      },
      {
        name: 'TESTING_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5003,
        }
      },
      {
        name: 'ANALYTIC_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5004,
        }
      },
      {
        name: 'CRON_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5005,
        }
      }
    ]),
  ],
  controllers: [GatewayController, AuthorizationController, UserController, TestingController, AnalyticController],
  providers: [GatewayService, JwtAuthGuard, RolesGuard],
})
export class GatewayModule {}
