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

import { DataSource } from 'typeorm';
import { Roles } from '../entities/roles.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Roles);

  const roles = ['администратор', 'студент', 'наставник', 'преподаватель'];

  for (const name of roles) {
    const existing = await roleRepo.findOne({ where: { name } });
    if (!existing) {
      const role = roleRepo.create({ name });
      await roleRepo.save(role);
      console.log(`Role "${name}" created`);
    } else {
      console.log(`Role "${name}" already exists`);
    }
  }
}