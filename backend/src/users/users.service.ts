import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { hash, compare } from 'bcrypt';

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

    async getAllUsersPaginated(page: number, limit: number) {
        const { data: users, total } = await this.db.findAllUsersPaginated(page, limit);
        const questions = await this.db.getAllQuestions();
        const questionMap = new Map(questions.map(q => [q._id.toString(), q.text]));

        const mappedUsers = users.map(user => {
            const userObj = user.toObject();
            const { password: _, ...userWithoutPassword } = userObj;
            return {
                ...userWithoutPassword,
                currentQuestionText: userObj.currentQuestionId ? (questionMap.get(userObj.currentQuestionId.toString()) || 'Pregunta no encontrada') : '-'
            };
        });

        return { data: mappedUsers, total };
    }

    async createUser(data: any) {
        if (!data.role) {
            throw new Error('Role is required');
        }

        if (data.password) {
            data.password = await hash(data.password, 12);
        }
        return this.db.createUser(data);
    }

    async updateUser(id: string, data: any) {
        if (data.password) {
            data.password = await hash(data.password, 12);
        }
        return this.db.updateUser(id, data);
    }

    async updateProfilePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.db.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('La contraseña actual es incorrecta');
        }

        const hashedPassword = await hash(newPassword, 12);
        return this.db.updateUser(userId, { password: hashedPassword });
    }

    async deleteUser(id: string) {
        return this.db.deleteUser(id);
    }

    async unlockUser(id: string) {
        const user = await this.db.findUserById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return this.db.unlockUser(user.email);
    }
}
