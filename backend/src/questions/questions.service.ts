import { Injectable, OnModuleInit } from '@nestjs/common';
import { QuestionService } from './services/question.service';
import { UserService } from '../users/services/user.service';
import { AnswerService } from '../answers/services/answer.service';
import { Question } from '../database/schemas/question.schema';
import { questionsData } from './questions.data';
import { QuestionPool } from './question-pool';
import { ActiveTopicFilter } from './active-topic-filter';
import { Questioner, QuestionResult } from './questioner';

@Injectable()
export class QuestionsService implements OnModuleInit {
    constructor(
        private readonly questionService: QuestionService,
        private readonly userService: UserService,
        private readonly answerService: AnswerService,
    ) {}

    async onModuleInit() {
        await this.syncTopics();
    }

    private async syncTopics() {
        const questions = await this.questionService.getAllQuestions();
        const detectedTopics = [...new Set(questions.map((q) => q.topic).filter(Boolean))];
        for (const topicName of detectedTopics) {
            await this.questionService.upsertTopic(topicName!);
        }
    }

    public async seedQuestions() {
        const existingQuestions = await this.questionService.getAllQuestions();
        if (existingQuestions.length > 0) {
            return;
        }

        for (const question of questionsData) {
            await this.questionService.createQuestion(question);
        }
    }

    async getRandomQuestion(userId: string): Promise<QuestionResult> {
        const user = await this.userService.findUserById(userId);

        const currentQuestion =
            (await this.findTodaysAssignedQuestion(user)) ?? (await this.assignNewQuestion(userId));

        const questioner = Questioner.create(user?.role, this.questionService, this.userService, this.answerService, userId, currentQuestion);
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

        return this.questionService.getQuestionById(user.currentQuestionId);
    }

    private async assignNewQuestion(userId: string): Promise<Question> {
        const allQuestions = await this.questionService.getAllQuestions();
        const allTopics = await this.questionService.getAllTopics();

        const all = new QuestionPool(allQuestions);
        const activeTopicNames = new ActiveTopicFilter(allTopics).getActiveNames();
        const active = all.filterByTopics(activeTopicNames);
        const pool = active.isEmpty() ? all : active;

        if (pool.isEmpty()) {
            throw new Error('No questions available in the database');
        }

        const question = pool.pickRandom();
        await this.userService.assignQuestionToUser(userId, question._id!.toString());
        return question;
    }
}
