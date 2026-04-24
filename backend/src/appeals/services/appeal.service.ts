import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appeal, AppealDocument } from '../../database/schemas/appeal.schema';

@Injectable()
export class AppealService {
    constructor(
        @InjectModel(Appeal.name) private appealModel: Model<AppealDocument>,
    ) {}

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

    async getAllAppealsPaginated(page: number, limit: number): Promise<{ data: AppealDocument[]; total: number }> {
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
}
