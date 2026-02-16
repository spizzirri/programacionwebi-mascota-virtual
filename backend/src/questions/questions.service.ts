import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Question } from '../database/schemas/question.schema';
import { questionsData } from './questions.data';

@Injectable()
export class QuestionsService implements OnModuleInit {
    constructor(private readonly db: DatabaseService) { }

    async onModuleInit() {
        if (process.env.USE_IN_MEMORY_DB === 'true') {
            await this.seedQuestions();
        }
    }

    public async seedQuestions() {
        const existingQuestions = await this.db.getAllQuestions();
        if (existingQuestions.length > 0) {
            return;
        }

        for (const question of questionsData) {
            await this.db.createQuestion(question);
        }
    }

    async getRandomQuestion(userId: string): Promise<{ question: Question; hasAnswered: boolean }> {
        const user = await this.db.findUserById(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentQuestion: Question | null = null;

        if (user?.currentQuestionId && user?.lastQuestionAssignedAt) {
            const assignmentDate = new Date(user.lastQuestionAssignedAt);
            assignmentDate.setHours(0, 0, 0, 0);

            if (assignmentDate.getTime() === today.getTime()) {
                currentQuestion = await this.db.getQuestionById(user.currentQuestionId);
            }
        }

        if (!currentQuestion) {
            const questions = await this.db.getAllQuestions();
            const randomIndex = Math.floor(Math.random() * questions.length);
            currentQuestion = questions[randomIndex];

            await this.db.assignQuestionToUser(userId, (currentQuestion as any)._id.toString());
        }

        const hasAnswered = !!(await this.db.getAnswerForQuestionToday(userId, (currentQuestion as any)._id.toString()));

        return { question: currentQuestion, hasAnswered };
    }
}
