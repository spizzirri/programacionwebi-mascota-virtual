import { Controller, Post, Session, HttpException, HttpStatus } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';
import { DatabaseService } from './database.service';

interface SessionData {
    userId?: string;
}

@Controller('database')
export class DatabaseController {
    constructor(
        private readonly questionsService: QuestionsService,
        private readonly db: DatabaseService,
    ) { }

    @Post('seed-questions')
    async seedQuestions(@Session() session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.db.findUserById(session.userId);
        if (!user || user.role !== 'PROFESSOR') {
            throw new HttpException('Forbidden: Only professors can seed questions', HttpStatus.FORBIDDEN);
        }

        await this.questionsService.seedQuestions();
        return { message: 'Questions seeded successfully' };
    }
}
