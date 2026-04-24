import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Answer, AnswerDocument } from '../../database/schemas/answer.schema';

@Injectable()
export class AnswerService {
    constructor(
        @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    ) {}

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
}
