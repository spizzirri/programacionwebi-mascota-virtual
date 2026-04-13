import { IsOptional, IsEnum, IsEmail, IsString } from 'class-validator';

export enum Commission {
    MANANA = 'MAÑANA',
    NOCHE = 'NOCHE',
}

export class UserUpdateDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsEnum(['PROFESSOR', 'STUDENT'])
    role?: string;

    @IsOptional()
    @IsEnum(Commission, {
        message: `commission must be either MAÑANA or NOCHE`,
    })
    commission?: string;

    @IsOptional()
    streak?: number;

    @IsOptional()
    currentQuestionId?: string;

    @IsOptional()
    lastQuestionAssignedAt?: Date;

    @IsOptional()
    lastQuestionAnsweredCorrectly?: Date;
}
