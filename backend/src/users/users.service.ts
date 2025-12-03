import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
    constructor(private readonly db: DatabaseService) { }

    async getProfile(userId: string) {
        const user = await this.db.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getHistory(userId: string, limit = 50) {
        const answers = await this.db.getAnswersByUserId(userId, limit);
        return answers;
    }
}
