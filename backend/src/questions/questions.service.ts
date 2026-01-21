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

    async getRandomQuestion(): Promise<Question> {
        const questions = await this.db.getAllQuestions();
        const randomIndex = Math.floor(Math.random() * questions.length);
        return questions[randomIndex];
    }
}
