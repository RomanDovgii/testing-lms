import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @IsInt()
  id: number;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsInt()
  taskId?: number;

  @IsOptional()
  @IsInt()
  ownerId?: number;
}
