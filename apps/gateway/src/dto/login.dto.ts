import { IsEmail, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
    @IsString()
    identifier: string;
    
    @IsString()
    @MinLength(8)
    password: string;    
}