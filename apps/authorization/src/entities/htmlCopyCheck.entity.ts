import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tasks } from './tasks.entity';

@Entity('html_copy_check')
export class HtmlCopyCheck {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tasks, (task) => task.htmlCopyChecks)
  task: Tasks;

  @Column({ default: true })
  enabled: boolean;
}