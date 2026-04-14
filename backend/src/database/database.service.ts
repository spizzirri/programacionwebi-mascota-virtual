import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Question, QuestionDocument } from './schemas/question.schema';
import { Answer, AnswerDocument } from './schemas/answer.schema';
import { Appeal, AppealDocument } from './schemas/appeal.schema';
import { Topic, TopicDocument } from './schemas/topic.schema';

@Injectable()
export class DatabaseService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
        @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
        @InjectModel(Appeal.name) private appealModel: Model<AppealDocument>,
        @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    ) { }

    async createUser(user: Partial<User>): Promise<UserDocument> {
        const createdUser = new this.userModel(user);
        return createdUser.save();
    }

    async findUserByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async incrementFailedLoginAttempts(email: string): Promise<UserDocument | null> {
        return this.userModel.findOneAndUpdate(
            { email },
            { $inc: { failedLoginAttempts: 1 } },
            { returnDocument: 'after' }
        ).exec();
    }

    async resetFailedLoginAttempts(email: string): Promise<void> {
        await this.userModel.updateOne(
            { email },
            { $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: '' } }
        ).exec();
    }

    async lockUser(email: string, lockDurationMinutes = 15): Promise<UserDocument | null> {
        const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
        return this.userModel.findOneAndUpdate(
            { email },
            { $set: { failedLoginAttempts: 3, lockedUntil } },
            { returnDocument: 'after' }
        ).exec();
    }

    async unlockUser(email: string): Promise<UserDocument | null> {
        return this.userModel.findOneAndUpdate(
            { email },
            { $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: '' } },
            { returnDocument: 'after' }
        ).exec();
    }

    async findUserById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async updateUserStreak(userId: string, streak: number, updateLastCorrectDate = false): Promise<void> {
        const updateData: any = { streak };
        if (updateLastCorrectDate) {
            updateData.lastQuestionAnsweredCorrectly = new Date();
        }
        await this.userModel.findByIdAndUpdate(userId, updateData).exec();
    }

    async assignQuestionToUser(userId: string, questionId: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            currentQuestionId: questionId,
            lastQuestionAssignedAt: new Date(),
        }).exec();
    }

    async createQuestion(question: Partial<Question>): Promise<QuestionDocument> {
        if (question.topic) {
            await this.upsertTopic(question.topic);
        }
        const createdQuestion = new this.questionModel(question);
        return createdQuestion.save();
    }

    async getAllQuestions(): Promise<QuestionDocument[]> {
        return this.questionModel.find().exec();
    }

    async getAllQuestionsPaginated(page: number, limit: number): Promise<{ data: QuestionDocument[], total: number }> {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.questionModel.find().skip(skip).limit(limit).exec(),
            this.questionModel.countDocuments().exec(),
        ]);
        return { data, total };
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

    async findAllUsersPaginated(page: number, limit: number): Promise<{ data: UserDocument[], total: number }> {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.userModel.find().skip(skip).limit(limit).exec(),
            this.userModel.countDocuments().exec(),
        ]);
        return { data, total };
    }

    async deleteUser(id: string): Promise<void> {
        await this.userModel.findByIdAndDelete(id).exec();
    }

    async updateUser(id: string, data: Partial<User>): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
    }

    async updateQuestion(id: string, data: Partial<Question>): Promise<QuestionDocument | null> {
        return this.questionModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
    }

    async deleteQuestion(id: string): Promise<void> {
        await this.questionModel.findByIdAndDelete(id).exec();
    }

    async createQuestions(questions: Partial<Question>[]): Promise<QuestionDocument[]> {
        const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
        for (const topic of topics) {
            await this.upsertTopic(topic!);
        }
        return this.questionModel.insertMany(questions) as unknown as QuestionDocument[];
    }

    async deleteAllQuestions(): Promise<void> {
        await this.questionModel.deleteMany({}).exec();
    }

    async createAppeal(appeal: Partial<Appeal>): Promise<AppealDocument> {
        const createdAppeal = new this.appealModel(appeal);
        return createdAppeal.save();
    }

    async getAppealsByUserId(userId: string): Promise<AppealDocument[]> {
        return this.appealModel.find({ userId }).sort({ createdAt: -1 }).exec();
    }

    async getAllAppeals(): Promise<AppealDocument[]> {
        return this.appealModel.find().sort({ createdAt: -1 }).exec();
    }

    async getAllAppealsPaginated(page: number, limit: number): Promise<{ data: AppealDocument[], total: number }> {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.appealModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.appealModel.countDocuments().exec(),
        ]);
        return { data, total };
    }

    async getAppealById(id: string): Promise<AppealDocument | null> {
        return this.appealModel.findById(id).exec();
    }

    async updateAppeal(id: string, data: Partial<Appeal>): Promise<AppealDocument | null> {
        return this.appealModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async upsertTopic(name: string): Promise<TopicDocument> {
        return this.topicModel.findOneAndUpdate(
            { name },
            { $setOnInsert: { name, enabled: true } },
            { upsert: true, returnDocument: 'after' }
        ).exec() as Promise<TopicDocument>;
    }

    async getAllTopics(): Promise<TopicDocument[]> {
        return this.topicModel.find().sort({ name: 1 }).exec();
    }

    async getTopicByName(name: string): Promise<TopicDocument | null> {
        return this.topicModel.findOne({ name }).exec();
    }

    async updateTopic(name: string, data: Partial<Topic>): Promise<TopicDocument | null> {
        return this.topicModel.findOneAndUpdate({ name }, data, { returnDocument: 'after' }).exec();
    }
}
