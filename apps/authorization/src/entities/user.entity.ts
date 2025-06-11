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

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Relation,
} from 'typeorm';
import { Groups } from './group.entity'; // Используем groups.entity
import { Roles } from './roles.entity';
import { Tasks } from './tasks.entity';
import { Test } from './test.entity'; // Добавлен из первой версии

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column()
    surname: string;

    @Column({ unique: true })
    github: string;

    @Column()
    isActive: boolean;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;

    @ManyToOne(() => Groups, (group) => group.users, {
        cascade: true,
        eager: true,
        nullable: true,
    })
    @JoinColumn()
    group: Relation<Groups>;

    @ManyToOne(() => Roles, (role) => role.users, { eager: true })
    role: Relation<Roles>;

    @OneToMany(() => Test, (test) => test.uploadedBy, {nullable: true})
    tests: Test[];

    @OneToMany(() => Tasks, (tasks) => tasks.owner, {nullable: true})
    tasksOwnership: Tasks[];

    @ManyToOne(() => Tasks, (tasks) => tasks.participants, {nullable: true})
    taskParticipation: Relation<Tasks>;
}

