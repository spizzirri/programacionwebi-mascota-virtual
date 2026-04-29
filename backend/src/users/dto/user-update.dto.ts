import { IsOptional, IsEnum, IsEmail, IsString } from 'class-validator';
import { VALID_ROLES } from '../../common/constants/roles.constants';
import { COMMISSION_VALUES } from '../../common/constants/commission.constants';

export class UserUpdateDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsEnum(VALID_ROLES)
    role?: string;

    @IsOptional()
    @IsEnum(COMMISSION_VALUES, {
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
