import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Tasks } from './tasks.entity';

@Entity('validation_results')
export class ValidationResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  githubLogin: string;

  @ManyToOne(() => Tasks, { nullable: false })
  task: Tasks;

  @Column({ type: 'boolean' })
  isValid: boolean;

  @Column({ type: 'json', nullable: true })
  errors: any;

  @CreateDateColumn()
  createdAt: Date;
}