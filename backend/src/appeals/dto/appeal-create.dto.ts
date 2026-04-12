import { IsString, IsNotEmpty } from 'class-validator';

export class AppealCreateDto {
    @IsString()
    @IsNotEmpty()
    answerId: string;
}
