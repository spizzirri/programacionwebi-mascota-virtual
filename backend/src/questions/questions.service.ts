import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Question } from '../database/schemas/question.schema';
import { questionsData } from './questions.data';

@Injectable()
export class QuestionsService implements OnModuleInit {
    constructor(private readonly db: DatabaseService) { }

    async onModuleInit() {
        // Seed questions on startup
        await this.seedQuestions();
    }

    private async seedQuestions() {
        const existingQuestions = await this.db.getAllQuestions();
        if (existingQuestions.length > 0) {
            return; // Already seeded
        }

        for (const question of questionsData) {
            await this.db.createQuestion(question);
        }
    }

    async getRandomQuestion(userId: string): Promise<Question> {
        const user = await this.db.findUserById(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (user?.currentQuestionId && user?.lastQuestionAssignedAt) {
            const assignmentDate = new Date(user.lastQuestionAssignedAt);
            assignmentDate.setHours(0, 0, 0, 0);

            if (assignmentDate.getTime() === today.getTime()) {
                const existingQuestion = await this.db.getQuestionById(user.currentQuestionId);
                if (existingQuestion) {
                    return existingQuestion;
                }
            }
        }

        const questions = await this.db.getAllQuestions();
        const randomIndex = Math.floor(Math.random() * questions.length);
        const question = questions[randomIndex];

        await this.db.assignQuestionToUser(userId, (question as any)._id.toString());

        return question;
    }
}
