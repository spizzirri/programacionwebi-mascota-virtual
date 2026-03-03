import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Question } from '../database/schemas/question.schema';
import { questionsData } from './questions.data';
import { QuestionPool } from './question-pool';
import { ActiveTopicFilter } from './active-topic-filter';
import { Questioner, QuestionResult } from './questioner';

@Injectable()
export class QuestionsService implements OnModuleInit {
    constructor(private readonly db: DatabaseService) { }

    async onModuleInit() {
        if (process.env.USE_IN_MEMORY_DB === 'true') {
            await this.seedQuestions();
        }
        await this.syncTopics();
    }

    private async syncTopics() {
        const questions = await this.db.getAllQuestions();
        const detectedTopics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
        for (const topicName of detectedTopics) {
            await this.db.upsertTopic(topicName!);
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

    async getRandomQuestion(userId: string): Promise<QuestionResult> {
        const user = await this.db.findUserById(userId);

        const currentQuestion =
            await this.findTodaysAssignedQuestion(user)
            ?? await this.assignNewQuestion(userId);

        const questioner = Questioner.create(user?.role, this.db, userId, currentQuestion);
        return questioner.getRandomQuestion();
    }

    private async findTodaysAssignedQuestion(user: any): Promise<Question | null> {
        if (!user?.currentQuestionId || !user?.lastQuestionAssignedAt) {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const assignmentDate = new Date(user.lastQuestionAssignedAt);
        assignmentDate.setHours(0, 0, 0, 0);

        if (assignmentDate.getTime() !== today.getTime()) {
            return null;
        }

        return this.db.getQuestionById(user.currentQuestionId);
    }

    private async assignNewQuestion(userId: string): Promise<Question> {
        const allQuestions = await this.db.getAllQuestions();
        const allTopics = await this.db.getAllTopics();

        const all = new QuestionPool(allQuestions);
        const activeTopicNames = new ActiveTopicFilter(allTopics).getActiveNames();
        const active = all.filterByTopics(activeTopicNames);
        const pool = active.isEmpty() ? all : active;

        if (pool.isEmpty()) {
            throw new Error('No questions available in the database');
        }

        const question = pool.pickRandom();
        await this.db.assignQuestionToUser(userId, (question as any)._id.toString());
        return question;
    }
}
