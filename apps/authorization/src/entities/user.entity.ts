import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Relation } from "typeorm";
import { Groups } from "./group.entity";
import { Roles } from "./roles.entity";
import { Test } from "./test.entity";
import { Tasks } from "./tasks.entity";

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

    @OneToMany(() => Test, (test) => test.uploadedBy, {nullable: true})
    tests: Test[];

    @OneToMany(() => Tasks, (tasks) => tasks.owner, {nullable: true})
    tasksOwnership: Tasks[];

    @ManyToOne(() => Tasks, (tasks) => tasks.participants, {nullable: true})
    taskParticipation: Relation<Tasks>;
}

