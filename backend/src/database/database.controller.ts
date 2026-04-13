import { Controller, Post, Session, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { SessionData } from '../common/types/session.types';
import { questionsData } from '../questions/questions.data';

@Controller('database')
export class DatabaseController {
    constructor(
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

        const existingQuestions = await this.db.getAllQuestions();
        if (existingQuestions.length > 0) {
            return { message: 'Questions already exist, skipping seed', seeded: false };
        }

        for (const question of questionsData) {
            await this.db.createQuestion(question);
        }

        return { message: 'Questions seeded successfully', seeded: true };
    }
}
