import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Test } from './test.entity';

@Entity('test_results')
export class TestResult {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Test, (test) => test.id, { onDelete: 'CASCADE' })
  test: Test;

  @Column()
  githubLogin: string;

  @Column('json')
  results: any;

  @CreateDateColumn()
  createdAt: Date;
}