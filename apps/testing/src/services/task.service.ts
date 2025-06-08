import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tasks } from '../entities/tasks.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SomeService {
  constructor(
    @InjectRepository(Tasks)
    private readonly taskRepository: Repository<Tasks>,
  ) {}

  async findTaskByName(name: string): Promise<Tasks | null> {
    return this.taskRepository.findOne({ where: { name: name } });
  }
}