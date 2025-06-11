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

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Relation,
    IntegerType,
} from 'typeorm';
import { User } from './user.entity';
import { Anomaly } from './anomaly.entity';
import { HtmlCopyCheck } from './htmlCopyCheck.entity';
import { HtmlCopyMatch } from './htmlCopyMatch.entity';

@Entity('tasks')
export class Tasks {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    link: string;

    @Column()
    branch: string;

    @Column({nullable: true})
    taskId: number;

    @ManyToOne(() => User, (user) => user.tasksOwnership, { onDelete: 'CASCADE' })
    owner: User;

    @OneToMany(() => User, (user) => user.taskParticipation)
    participants: User[];

    @OneToMany(() => Anomaly, (anomaly) => anomaly.task)
    anomalies: Anomaly[];

    @OneToMany(() => HtmlCopyCheck, (htmlCopyCheck) => htmlCopyCheck.task)
    htmlCopyChecks: HtmlCopyCheck[];

    @OneToMany(() => HtmlCopyMatch, (htmlCopyMatch) => htmlCopyMatch.task)
    htmlCopyMatches: HtmlCopyMatch[];
}