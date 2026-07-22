import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Problem, ProblemDocument, TestCase } from '../../database/schemas/problem.schema';

export type ProblemCreation = Omit<Problem, '_id' | 'active'> & { active?: boolean };

@Injectable()
export class ProblemService {
    constructor(
        @InjectModel(Problem.name) private readonly problemModel: Model<ProblemDocument>,
    ) {}

    async getActiveProblems(): Promise<Problem[]> {
        return this.problemModel.find({ active: true }).exec();
    }

    async getAllProblemsForAdmin(): Promise<Problem[]> {
        return this.problemModel.find({}).sort({ createdAt: 1 }).exec();
    }

    async getProblemById(id: string): Promise<Problem> {
        const problem = await this.problemModel.findById(id).exec();
        if (!problem) {
            throw new NotFoundException('Problem not found');
        }
        return problem;
    }

    async createProblem(data: ProblemCreation): Promise<Problem> {
        const created = new this.problemModel({ active: true, ...data });
        return created.save();
    }

    async updateProblem(id: string, patch: Partial<Problem>): Promise<Problem | null> {
        return this.problemModel.findByIdAndUpdate(id, patch, { new: true }).exec();
    }

    async deleteProblem(id: string): Promise<void> {
        await this.problemModel.findByIdAndDelete(id).exec();
    }

    async countProblems(): Promise<number> {
        return this.problemModel.countDocuments().exec();
    }
}