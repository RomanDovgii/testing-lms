import { IsInt } from 'class-validator';

export class DeleteTestDto {
  @IsInt()
  testId: number;

  @IsInt()
  userId: number;
}
