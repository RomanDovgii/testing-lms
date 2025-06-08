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
    })
    @JoinColumn()
    group: Relation<Groups>;

    @ManyToOne(() => Roles, (role) => role.users, { eager: true })
    role: Relation<Roles>;

    @OneToMany(() => Test, (test) => test.uploadedBy)
    tests: Test[];

    @OneToMany(() => Tasks, (tasks) => tasks.owner)
    tasksOwnership: Tasks[];

    @ManyToOne(() => Tasks, (tasks) => tasks.participants)
    taskParticipation: Relation<Tasks>;
}
