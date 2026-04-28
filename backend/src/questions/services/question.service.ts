import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from '../../database/schemas/question.schema';
import { Topic, TopicDocument } from '../../database/schemas/topic.schema';

@Injectable()
export class QuestionService {
    constructor(
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
        @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    ) {}

    async createQuestion(question: Partial<Question>): Promise<QuestionDocument> {
        if (question.topic) {
            await this.upsertTopic(question.topic);
        }
        const createdQuestion = new this.questionModel(question);
        return createdQuestion.save();
    }

    async createQuestions(questions: Partial<Question>[]): Promise<QuestionDocument[]> {
        const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))];
        for (const topic of topics) {
            await this.upsertTopic(topic!);
        }
        return this.questionModel.insertMany(questions) as unknown as QuestionDocument[];
    }

    async getAllQuestions(): Promise<QuestionDocument[]> {
        return this.questionModel.find().exec();
    }

    async getQuestionById(id: string): Promise<QuestionDocument> {
        const question = await this.questionModel.findById(id).exec();
        if (!question) {
            throw new NotFoundException('Question not found');
        }
        return question;
    }

    async updateQuestion(id: string, data: Partial<Question>): Promise<QuestionDocument | null> {
        if (data.topic) {
            await this.upsertTopic(data.topic);
        }
        return this.questionModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
    }

    async deleteQuestion(id: string): Promise<void> {
        await this.questionModel.findByIdAndDelete(id).exec();
    }

    async deleteAllQuestions(): Promise<void> {
        await this.questionModel.deleteMany({}).exec();
    }

    async upsertTopic(name: string): Promise<TopicDocument> {
        return this.topicModel.findOneAndUpdate(
            { name },
            { $setOnInsert: { name, enabled: true } },
            { upsert: true, returnDocument: 'after' },
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
