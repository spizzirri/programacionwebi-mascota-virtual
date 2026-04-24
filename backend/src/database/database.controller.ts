import { Controller, Post, Session } from '@nestjs/common';
import { QuestionService } from '../questions/services/question.service';
import { UserService } from '../users/services/user.service';
import type { SessionData } from '../common/types/session.types';
import { questionsData } from '../questions/questions.data';
import { PROFESSOR_ROLE } from '../common/constants/roles.constants';

@Controller('database')
export class DatabaseController {
    constructor(
        private readonly questionService: QuestionService,
        private readonly userService: UserService,
    ) {}

    @Post('seed-questions')
    async seedQuestions(@Session() session: SessionData) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }

        const user = await this.userService.findUserById(session.userId);
        if (!user || user.role !== PROFESSOR_ROLE) {
            throw new Error('Forbidden: Only professors can seed questions');
        }

        const existingQuestions = await this.questionService.getAllQuestions();
        if (existingQuestions.length > 0) {
            return { message: 'Questions already exist, skipping seed', seeded: false };
        }

        for (const question of questionsData) {
            await this.questionService.createQuestion(question);
        }

        return { message: 'Questions seeded successfully', seeded: true };
    }
}
