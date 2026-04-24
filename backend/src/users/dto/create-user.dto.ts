import { IsEmail, IsString, MinLength, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    password: string;

    @IsEnum(['PROFESSOR', 'STUDENT'], { message: 'Role must be either PROFESSOR or STUDENT' })
    @IsNotEmpty()
    role: string;
}
