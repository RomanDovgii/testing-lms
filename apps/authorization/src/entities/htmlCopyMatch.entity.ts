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

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tasks } from './tasks.entity';

@Entity('html_copy_match')
export class HtmlCopyMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  githubLogin1: string;

  @Column()
  githubLogin2: string;

  @ManyToOne(() => Tasks)
  task: Tasks;

  @Column()
  filename: string;

  @Column('float')
  similarityPercent: number;

  @Column({ type: 'timestamp' })
  detectedAt: Date;
}