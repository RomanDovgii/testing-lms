import { IsBoolean, IsEmail, isNumber, IsNumber, IsString, MinLength } from 'class-validator';

export class TaskDto {
    @IsString()
    name: string;

    @IsString()
    link: string;

    @IsString()
    branch: string;

    @IsNumber()
    taskId: number;
    
    @IsNumber()
    ownerId: number;
}