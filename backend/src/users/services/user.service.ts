import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MINUTES } from '../../common/constants/auth.constants';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

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

    async findAllUsers(): Promise<UserDocument[]> {
        return this.userModel.find().exec();
    }

    async updateUser(id: string, data: Partial<User>): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
    }

    async deleteUser(id: string): Promise<void> {
        await this.userModel.findByIdAndDelete(id).exec();
    }

    async incrementFailedLoginAttempts(email: string): Promise<UserDocument | null> {
        return this.userModel.findOneAndUpdate(
            { email },
            { $inc: { failedLoginAttempts: 1 } },
            { returnDocument: 'after' },
        ).exec();
    }

    async resetFailedLoginAttempts(email: string): Promise<void> {
        await this.userModel.updateOne(
            { email },
            { $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: '' } },
        ).exec();
    }

    async lockUser(email: string, lockDurationMinutes = LOCK_DURATION_MINUTES): Promise<UserDocument | null> {
        const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
        return this.userModel.findOneAndUpdate(
            { email },
            { $set: { failedLoginAttempts: MAX_LOGIN_ATTEMPTS, lockedUntil } },
            { returnDocument: 'after' },
        ).exec();
    }

    async unlockUser(email: string): Promise<UserDocument | null> {
        return this.userModel.findOneAndUpdate(
            { email },
            { $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: '' } },
            { returnDocument: 'after' },
        ).exec();
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

    async isUserLocked(user: UserDocument): Promise<{ isLocked: boolean; minutesLeft?: number }> {
        if (user.failedLoginAttempts < MAX_LOGIN_ATTEMPTS) {
            return { isLocked: false };
        }

        if (!user.lockedUntil) {
            return { isLocked: false };
        }

        const now = new Date();
        if (now < user.lockedUntil) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            return { isLocked: true, minutesLeft };
        }

        return { isLocked: false };
    }

    async autoUnlockUser(email: string): Promise<void> {
        await this.resetFailedLoginAttempts(email);
    }
}
