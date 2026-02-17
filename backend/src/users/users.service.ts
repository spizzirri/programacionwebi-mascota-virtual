import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private readonly db: DatabaseService) { }

    async getProfile(userId: string) {
        const user = await this.db.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async getHistory(userId: string, limit = 50) {
        const answers = await this.db.getAnswersByUserId(userId, limit);
        return answers;
    }

    async getAllUsers() {
        const users = await this.db.findAllUsers();
        const questions = await this.db.getAllQuestions();
        const questionMap = new Map(questions.map(q => [q._id.toString(), q.text]));

        return users.map(user => {
            const userObj = user.toObject();
            const { password: _, ...userWithoutPassword } = userObj;
            return {
                ...userWithoutPassword,
                currentQuestionText: userObj.currentQuestionId ? (questionMap.get(userObj.currentQuestionId.toString()) || 'Pregunta no encontrada') : '-'
            };
        });
    }

    async createUser(data: any) {
        if (!data.role) {
            throw new Error('Role is required');
        }

        if (data.password) {
            data.password = await hash(data.password, 10);
        }
        return this.db.createUser(data);
    }

    async updateUser(id: string, data: any) {
        if (data.password) {
            data.password = await hash(data.password, 10);
        }
        return this.db.updateUser(id, data);
    }

    async deleteUser(id: string) {
        return this.db.deleteUser(id);
    }
}
