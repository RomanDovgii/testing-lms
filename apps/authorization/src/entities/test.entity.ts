import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity'
import { Tasks } from './tasks.entity'

@Entity('test')
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  filename: string;

  @Column()
  filepath: string;

  @ManyToOne(() => User, (user) => user.tests, { eager: true })
  uploadedBy: User;

  @ManyToMany(() => Tasks, { nullable: true, eager: true })
  @JoinTable()
  tasks?: Tasks[];
}