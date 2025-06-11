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

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Tasks } from './tasks.entity';

@Entity()
@Index(['commitHash'], { unique: true })
export class RepoStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  githubLogin: string;

  @ManyToOne(() => Tasks)
  task: Tasks;

  @Column()
  commitHash: string;

  @Column({ type: 'timestamp' })
  commitDate: Date;

  @Column()
  additions: number;

  @Column()
  deletions: number;
}