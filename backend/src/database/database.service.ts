import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Question, QuestionDocument } from './schemas/question.schema';
import { Answer, AnswerDocument } from './schemas/answer.schema';

@Injectable()
export class DatabaseService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
        @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    ) { }

    async createUser(user: Partial<User>): Promise<UserDocument> {
        const createdUser = new this.userModel(user);
        return createdUser.save();
    }

    async findUserByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findUserById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async updateUserStreak(userId: string, streak: number): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { streak }).exec();
    }

    async assignQuestionToUser(userId: string, questionId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            currentQuestionId: questionId,
            lastQuestionAssignedAt: new Date(),
        }).exec();
    }

    async createQuestion(question: Partial<Question>): Promise<QuestionDocument> {
        const createdQuestion = new this.questionModel(question);
        return createdQuestion.save();
    }

    async getAllQuestions(): Promise<QuestionDocument[]> {
        return this.questionModel.find().exec();
    }

    async getQuestionById(id: string): Promise<QuestionDocument | null> {
        return this.questionModel.findById(id).exec();
    }

    async createAnswer(answer: Partial<Answer>): Promise<AnswerDocument> {
        const createdAnswer = new this.answerModel(answer);
        return createdAnswer.save();
    }

    async getAnswersByUserId(userId: string, limit = 50): Promise<AnswerDocument[]> {
        return this.answerModel
            .find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
    }

    async getAnswerForQuestionToday(userId: string, questionId: string): Promise<AnswerDocument | null> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.answerModel.findOne({
            userId,
            questionId,
            timestamp: {
                $gte: today,
                $lt: tomorrow,
            },
        }).exec();
    }

    async findAllUsers(): Promise<UserDocument[]> {
        return this.userModel.find().exec();
    }

    async deleteUser(id: string): Promise<void> {
        await this.userModel.findByIdAndDelete(id).exec();
    }

    async updateUser(id: string, data: Partial<User>): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async updateQuestion(id: string, data: Partial<Question>): Promise<QuestionDocument | null> {
        return this.questionModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async deleteQuestion(id: string): Promise<void> {
        await this.questionModel.findByIdAndDelete(id).exec();
    }
}
