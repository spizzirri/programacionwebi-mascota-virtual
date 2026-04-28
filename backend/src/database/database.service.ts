import { Injectable } from '@nestjs/common';
import { UserService } from '../users/services/user.service';
import { QuestionService } from '../questions/services/question.service';
import { AnswerService } from '../answers/services/answer.service';
import { AppealService } from '../appeals/services/appeal.service';
import { User, UserDocument } from './schemas/user.schema';
import { Question, QuestionDocument } from './schemas/question.schema';
import { Answer, AnswerDocument } from './schemas/answer.schema';
import { Appeal, AppealDocument } from './schemas/appeal.schema';
import { Topic, TopicDocument } from './schemas/topic.schema';

@Injectable()
export class DatabaseService {
    constructor(
        private readonly userService: UserService,
        private readonly questionService: QuestionService,
        private readonly answerService: AnswerService,
        private readonly appealService: AppealService,
    ) {}

    async createUser(user: Partial<User>): Promise<UserDocument> {
        return this.userService.createUser(user);
    }

    async findUserByEmail(email: string): Promise<UserDocument | null> {
        return this.userService.findUserByEmail(email);
    }

    async incrementFailedLoginAttempts(email: string): Promise<UserDocument | null> {
        return this.userService.incrementFailedLoginAttempts(email);
    }

    async resetFailedLoginAttempts(email: string): Promise<void> {
        return this.userService.resetFailedLoginAttempts(email);
    }

    async lockUser(email: string, lockDurationMinutes = 15): Promise<UserDocument | null> {
        return this.userService.lockUser(email, lockDurationMinutes);
    }

    async unlockUser(email: string): Promise<UserDocument | null> {
        return this.userService.unlockUser(email);
    }

    async findUserById(id: string): Promise<UserDocument | null> {
        return this.userService.findUserById(id);
    }

    async updateUserStreak(userId: string, streak: number, updateLastCorrectDate = false): Promise<void> {
        return this.userService.updateUserStreak(userId, streak, updateLastCorrectDate);
    }

    async assignQuestionToUser(userId: string, questionId: string): Promise<void> {
        return this.userService.assignQuestionToUser(userId, questionId);
    }

    async createQuestion(question: Partial<Question>): Promise<QuestionDocument> {
        return this.questionService.createQuestion(question);
    }

    async getAllQuestions(): Promise<QuestionDocument[]> {
        return this.questionService.getAllQuestions();
    }

    async getQuestionById(id: string): Promise<QuestionDocument | null> {
        return this.questionService.getQuestionById(id);
    }

    async createAnswer(answer: Partial<Answer>): Promise<AnswerDocument> {
        return this.answerService.createAnswer(answer);
    }

    async getAnswersByUserId(userId: string, limit = 50): Promise<AnswerDocument[]> {
        return this.answerService.getAnswersByUserId(userId, limit);
    }

    async getAnswerForQuestionToday(userId: string, questionId: string): Promise<AnswerDocument | null> {
        return this.answerService.getAnswerForQuestionToday(userId, questionId);
    }

    async findAllUsers(): Promise<UserDocument[]> {
        return this.userService.findAllUsers();
    }

    async deleteUser(id: string): Promise<void> {
        return this.userService.deleteUser(id);
    }

    async updateUser(id: string, data: Partial<User>): Promise<UserDocument | null> {
        return this.userService.updateUser(id, data);
    }

    async updateQuestion(id: string, data: Partial<Question>): Promise<QuestionDocument | null> {
        return this.questionService.updateQuestion(id, data);
    }

    async deleteQuestion(id: string): Promise<void> {
        return this.questionService.deleteQuestion(id);
    }

    async createQuestions(questions: Partial<Question>[]): Promise<QuestionDocument[]> {
        return this.questionService.createQuestions(questions);
    }

    async deleteAllQuestions(): Promise<void> {
        return this.questionService.deleteAllQuestions();
    }

    async createAppeal(appeal: Partial<Appeal>): Promise<AppealDocument> {
        return this.appealService.createAppeal(appeal);
    }

    async getAppealsByUserId(userId: string): Promise<AppealDocument[]> {
        return this.appealService.getAppealsByUserId(userId);
    }

    async getAllAppeals(): Promise<AppealDocument[]> {
        return this.appealService.getAllAppeals();
    }

    async getAppealById(id: string): Promise<AppealDocument | null> {
        return this.appealService.getAppealById(id);
    }

    async updateAppeal(id: string, data: Partial<Appeal>): Promise<AppealDocument | null> {
        return this.appealService.updateAppeal(id, data);
    }

    async upsertTopic(name: string): Promise<TopicDocument> {
        return this.questionService.upsertTopic(name);
    }

    async getAllTopics(): Promise<TopicDocument[]> {
        return this.questionService.getAllTopics();
    }

    async getTopicByName(name: string): Promise<TopicDocument | null> {
        return this.questionService.getTopicByName(name);
    }

    async updateTopic(name: string, data: Partial<Topic>): Promise<TopicDocument | null> {
        return this.questionService.updateTopic(name, data);
    }
}
