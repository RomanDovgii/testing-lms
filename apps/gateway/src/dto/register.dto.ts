import { IsBoolean, IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    name: string;

    @IsString()
    surname: string;

    @IsString()
    group: string;
    
    @IsEmail()
    email: string;

    @IsString()
    github: string;
    
    @IsString()
    @MinLength(8)
    password: string;

    @IsBoolean()
    isProfessor: boolean;
}