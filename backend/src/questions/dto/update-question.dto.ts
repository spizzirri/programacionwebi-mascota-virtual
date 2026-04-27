import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateQuestionDto {
    @IsString()
    @IsNotEmpty({ message: 'Question text cannot be empty' })
    @IsOptional()
    text?: string;

    @IsString()
    @IsNotEmpty({ message: 'Topic cannot be empty' })
    @IsOptional()
    topic?: string;

    @IsString()
    @IsOptional()
    answer?: string;
}
