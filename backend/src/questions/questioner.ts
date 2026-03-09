import { Question } from '../database/schemas/question.schema';
import { DatabaseService } from '../database/database.service';
import { QuestionPool } from './question-pool';
import { ActiveTopicFilter } from './active-topic-filter';

export interface QuestionResult {
    question: Question;
    hasAnswered: boolean;
    answerId?: string;
    rating?: string;
}

export abstract class Questioner {
    constructor(
        protected readonly db: DatabaseService,
        protected readonly userId: string,
        protected readonly currentQuestion: Question
    ) { }

    static create(role: string | undefined, db: DatabaseService, userId: string, currentQuestion: Question): Questioner {
        if (role === 'PROFESSOR') {
            return new QuestionerForProfessor(db, userId, currentQuestion);
        }
        return new QuestionerForStudent(db, userId, currentQuestion);
    }

    abstract getRandomQuestion(): Promise<QuestionResult>;

    protected async buildActiveQuestionPool(): Promise<{ active: QuestionPool; all: QuestionPool }> {
        const allQuestions = await this.db.getAllQuestions();
        const allTopics = await this.db.getAllTopics();

        const all = new QuestionPool(allQuestions);
        const activeTopicNames = new ActiveTopicFilter(allTopics).getActiveNames();
        const active = all.filterByTopics(activeTopicNames);

        return { active, all };
    }
}

export class QuestionerForProfessor extends Questioner {
    async getRandomQuestion(): Promise<QuestionResult> {
        const answer = await this.db.getAnswerForQuestionToday(this.userId, (this.currentQuestion as any)._id.toString());

        if (!answer) {
            return { question: this.currentQuestion, hasAnswered: false, answerId: undefined, rating: undefined };
        }

        const { active, all } = await this.buildActiveQuestionPool();
        const pool = active.isEmpty() ? all : active;
        const nextQuestion = pool.pickDifferentFrom(this.currentQuestion);

        await this.db.assignQuestionToUser(this.userId, (nextQuestion as any)._id.toString());

        return { question: nextQuestion, hasAnswered: false, answerId: undefined, rating: undefined };
    }
}

export class QuestionerForStudent extends Questioner {
    async getRandomQuestion(): Promise<QuestionResult> {
        const answer = await this.db.getAnswerForQuestionToday(this.userId, (this.currentQuestion as any)._id.toString());
        const hasAnswered = !!answer;

        return {
            question: this.currentQuestion,
            hasAnswered,
            answerId: answer ? (answer as any)._id.toString() : undefined,
            rating: answer?.rating
        };
    }
}
