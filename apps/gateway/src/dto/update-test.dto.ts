import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateTestDto {
  @IsInt()
  testId: number;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
