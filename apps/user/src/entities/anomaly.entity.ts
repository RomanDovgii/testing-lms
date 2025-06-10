import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Tasks } from './tasks.entity';

@Entity()
export class Anomaly {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  githubLogin: string;

  @Column()
  commitDate: Date;

  @Column({nullable: true})
  commitHash: string;

  @ManyToOne(() => Tasks)
  task: Tasks;
}