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

