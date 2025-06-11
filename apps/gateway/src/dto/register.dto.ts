// Copyright (C) 2024 Roman Dovgii
// This file is part of ProjectName.
//
// ProjectName is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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