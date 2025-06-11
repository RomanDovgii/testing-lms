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

import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { Transport } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { seedRoles } from './seeder/roles.seed';


async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserModule, {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 5002,
      },
    });
    const dataSource = app.get(DataSource);
    await seedRoles(dataSource);
    
    await app.listen();
}
bootstrap();
