import { IsArray, IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionInputDto {
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

export class BulkCreateQuestionsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionInputDto)
    questions: QuestionInputDto[];
}
