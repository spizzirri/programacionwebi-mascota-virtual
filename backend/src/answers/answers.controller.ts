import { Controller, Post, Body, Session, HttpException, HttpStatus, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AnswersService } from './answers.service';
import { AnswerSubmitDto } from './dto/answer-submit.dto';
import { SessionData } from '../common/types/session.types';

@Controller('answers')
export class AnswersController {
    constructor(private readonly answersService: AnswersService) { }

    @Post('submit')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 1000, ttl: 60000 } })
    @UsePipes(new ValidationPipe({ transform: true }))
    async submitAnswer(
        @Body() answerDto: AnswerSubmitDto,
        @Session() session: SessionData,
    ) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        try {
            const result = await this.answersService.submitAnswer(
                session.userId,
                answerDto.questionId,
                answerDto.userAnswer,
            );

            return {
                success: true,
                rating: result.answer.rating,
                feedback: result.answer.feedback,
                suggestedAnswer: (result.answer as any).suggestedAnswer,
                newStreak: result.newStreak,
                answerId: (result.answer as any)._id,
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
