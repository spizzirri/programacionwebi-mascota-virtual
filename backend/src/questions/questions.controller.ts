import { Controller, Get, Session, HttpException, HttpStatus } from '@nestjs/common';
import { QuestionsService } from './questions.service';

interface SessionData {
    userId?: string;
}

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    @Get('random')
    async getRandomQuestion(@Session() session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const question = await this.questionsService.getRandomQuestion();
        return { question };
    }
}
