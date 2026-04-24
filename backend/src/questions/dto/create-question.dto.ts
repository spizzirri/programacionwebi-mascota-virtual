import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    @IsNotEmpty({ message: 'Question text is required' })
    text: string;

    @IsString()
    @IsNotEmpty({ message: 'Topic is required' })
    topic: string;

    @IsString()
    @IsOptional()
    answer?: string;
}
