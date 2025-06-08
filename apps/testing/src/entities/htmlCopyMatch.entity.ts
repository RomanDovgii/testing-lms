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