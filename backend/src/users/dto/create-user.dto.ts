import { IsEmail, IsString, MinLength, IsEnum, IsNotEmpty } from 'class-validator';
import { VALID_ROLES } from '../../common/constants/roles.constants';
import { COMMISSION_VALUES } from '../../common/constants/commission.constants';

export class CreateUserDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    password: string;

    @IsEnum(VALID_ROLES, { message: 'Role must be either PROFESSOR or STUDENT' })
    @IsNotEmpty()
    role: string;

    @IsEnum(COMMISSION_VALUES, { message: 'Commission must be either MAÑANA or NOCHE' })
    @IsNotEmpty()
    commission: string;
}
