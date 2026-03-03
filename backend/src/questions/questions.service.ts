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

    async getRandomQuestion(userId: string): Promise<{ question: Question; hasAnswered: boolean; answerId?: string; rating?: string }> {
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
            const allQuestions = await this.db.getAllQuestions();
            const allTopics = await this.db.getAllTopics();
            const now = new Date();

            const activeTopicNames = allTopics
                .filter(topic => {
                    if (!topic.enabled) return false;
                    if (topic.startDate && new Date(topic.startDate) > now) return false;
                    if (topic.endDate && new Date(topic.endDate) < now) return false;
                    return true;
                })
                .map(topic => topic.name);

            // If a topic exists in questions but not in topics collection (shouldn't happen with new logic but for safety)
            // or if we just want to allow topics that aren't explicitly configured yet as active by default?
            // The plan says we list topics for enabling/disabling, so if it's not in the list, we might want to treat it as "enabled"
            // but the upsert logic ensures they are in the collection.

            const availableQuestions = allQuestions.filter(q => activeTopicNames.includes(q.topic));

            if (availableQuestions.length === 0) {
                // Fallback to all questions if no active topics are found to avoid breaking the app,
                // or throw an error? Usually better to show something unless the professor explicitly disabled everything.
                if (allQuestions.length === 0) {
                    throw new Error('No questions available in the database');
                }
                // If there are questions but none are from active topics, maybe we should return a specific "no questions today" state?
                // For now, let's pick from any to avoid a crash, but ideally we should follow the restriction.
                const randomIndex = Math.floor(Math.random() * allQuestions.length);
                currentQuestion = allQuestions[randomIndex];
            } else {
                const randomIndex = Math.floor(Math.random() * availableQuestions.length);
                currentQuestion = availableQuestions[randomIndex];
            }

            await this.db.assignQuestionToUser(userId, (currentQuestion as any)._id.toString());
        }

        const answer = await this.db.getAnswerForQuestionToday(userId, (currentQuestion as any)._id.toString());

        if (answer && user?.role === 'PROFESSOR') {
            const questions = await this.db.getAllQuestions();
            let nextQuestion = currentQuestion;
            while (questions.length > 1 && (nextQuestion as any)._id.toString() === (currentQuestion as any)._id.toString()) {
                const randomIndex = Math.floor(Math.random() * questions.length);
                nextQuestion = questions[randomIndex];
            }
            currentQuestion = nextQuestion;
            await this.db.assignQuestionToUser(userId, (currentQuestion as any)._id.toString());

            return {
                question: currentQuestion,
                hasAnswered: false,
                answerId: undefined,
                rating: undefined
            };
        }

        const hasAnswered = !!answer;

        return {
            question: currentQuestion,
            hasAnswered,
            answerId: answer ? (answer as any)._id.toString() : undefined,
            rating: answer?.rating
        };
    }
}
