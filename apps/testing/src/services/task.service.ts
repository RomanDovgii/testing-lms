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

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tasks } from '../entities/tasks.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SomeService {
  constructor(
    @InjectRepository(Tasks)
    private readonly taskRepository: Repository<Tasks>,
  ) {}

  async findTaskByName(name: string): Promise<Tasks | null> {
    return this.taskRepository.findOne({ where: { name: name } });
  }
}