import { IsBoolean, IsEmail, IsNumber, IsString, MinLength } from 'class-validator';

export class TaskDto {
    @IsString()
    name: string;

    @IsString()
    link: string;

    @IsString()
    branch: string;
    
    @IsNumber()
    ownerId: number
}