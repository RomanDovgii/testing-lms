import { IsString, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class UploadTestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  taskIds: number[];

  @IsString()
  userId: number;
}