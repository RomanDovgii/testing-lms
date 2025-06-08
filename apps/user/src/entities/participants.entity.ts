import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('participating_github_users')
export class ParticipatingGithubUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taskId: string;

  @Column()
  taskName: string;

  @Column()
  githubLogin: string;
}