import { Controller, Post, Body, Session, HttpException, HttpStatus } from '@nestjs/common';
import { AnswersService } from './answers.service';

interface SessionData {
    userId?: string;
}

@Controller('answers')
export class AnswersController {
    constructor(private readonly answersService: AnswersService) { }

    @Post('submit')
    async submitAnswer(
        @Body() body: { questionId: string; questionText: string; userAnswer: string },
        @Session() session: SessionData,
    ) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        try {
            const result = await this.answersService.submitAnswer(
                session.userId,
                body.questionId,
                body.questionText,
                body.userAnswer,
            );

            return {
                success: true,
                rating: result.answer.rating,
                feedback: result.answer.feedback,
                newStreak: result.newStreak,
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
