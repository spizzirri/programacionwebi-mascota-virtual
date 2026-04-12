import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class PasswordUpdateDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @IsString()
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    newPassword: string;
}
