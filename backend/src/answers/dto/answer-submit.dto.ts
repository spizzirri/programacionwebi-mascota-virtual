import { IsString, IsNotEmpty } from 'class-validator';

export class AnswerSubmitDto {
    @IsString()
    @IsNotEmpty()
    questionId: string;

    @IsString()
    @IsNotEmpty()
    userAnswer: string;
}
