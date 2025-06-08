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