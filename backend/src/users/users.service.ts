import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './services/user.service';
import { QuestionService } from '../questions/services/question.service';
import { AnswerService } from '../answers/services/answer.service';
import { hash, compare } from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        private readonly userService: UserService,
        private readonly questionService: QuestionService,
        private readonly answerService: AnswerService,
    ) {}

    async getProfile(userId: string) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async getHistory(userId: string, limit = 50) {
        const answers = await this.answerService.getAnswersByUserId(userId, limit);
        return answers;
    }

    async getAllUsers() {
        const users = await this.userService.findAllUsers();
        const questions = await this.questionService.getAllQuestions();
        const questionMap = new Map(questions.map((q) => [q._id.toString(), q.text]));

        return users.map((user) => {
            const userObj = user.toObject();
            const { password: _, ...userWithoutPassword } = userObj;
            return {
                ...userWithoutPassword,
                currentQuestionText: userObj.currentQuestionId
                    ? questionMap.get(userObj.currentQuestionId.toString()) || 'Pregunta no encontrada'
                    : '-',
            };
        });
    }

    async createUser(data: any) {
        if (!data.role) {
            throw new BadRequestException('Role is required');
        }

        if (data.password) {
            data.password = await hash(data.password, 12);
        }
        return this.userService.createUser(data);
    }

    async updateUser(id: string, data: any) {
        if (data.password) {
            data.password = await hash(data.password, 12);
        }
        return this.userService.updateUser(id, data);
    }

    async updateProfilePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('La contraseña actual es incorrecta');
        }

        const hashedPassword = await hash(newPassword, 12);
        return this.userService.updateUser(userId, { password: hashedPassword });
    }

    async deleteUser(id: string) {
        return this.userService.deleteUser(id);
    }

    async unlockUser(id: string) {
        const user = await this.userService.findUserById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.userService.unlockUser(user.email);
    }
}
