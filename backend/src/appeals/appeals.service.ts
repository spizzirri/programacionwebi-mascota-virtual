import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../users/services/user.service';
import { AnswerService } from '../answers/services/answer.service';
import { AppealService } from './services/appeal.service';
import { PROFESSOR_ROLE } from '../common/constants/roles.constants';

@Injectable()
export class AppealsService {
    constructor(
        private readonly appealService: AppealService,
        private readonly answerService: AnswerService,
        private readonly userService: UserService,
    ) {}

    async createAppeal(userId: string, userName: string, answerId: string) {
        const answers = await this.answerService.getAnswersByUserId(userId);
        const answer = answers.find((a) => a._id.toString() === answerId);

        if (!answer) {
            throw new NotFoundException('Respuesta no encontrada');
        }

        return this.appealService.createAppeal({
            userId,
            userName,
            answerId,
            questionId: answer.questionId,
            questionText: answer.questionText,
            userAnswer: answer.userAnswer,
            originalRating: answer.rating,
            originalFeedback: answer.feedback,
            status: 'pending',
            createdAt: new Date(),
            streakAtMoment: answer.streakAtMoment || 0,
        });
    }

    async getMyAppeals(userId: string) {
        return this.appealService.getAppealsByUserId(userId);
    }

    async getAllAppeals() {
        return this.appealService.getAllAppeals();
    }

    async getAllAppealsPaginated(page: number, limit: number) {
        return this.appealService.getAllAppealsPaginated(page, limit);
    }

    async resolveAppeal(appealId: string, status: 'accepted' | 'rejected', professorFeedback: string) {
        const appeal = await this.appealService.getAppealById(appealId);
        if (!appeal) {
            throw new NotFoundException('Apelación no encontrada');
        }

        const updatedAppeal = await this.appealService.updateAppeal(appealId, {
            status,
            professorFeedback,
            resolvedAt: new Date(),
        });

        if (status === 'accepted') {
            const user = await this.userService.findUserById(appeal.userId);
            if (user) {
                let newStreak = user.streak;

                if (appeal.originalRating === 'incorrect') {
                    newStreak = appeal.streakAtMoment + 1 + user.streak;
                } else if (appeal.originalRating === 'partial') {
                    newStreak = user.streak + 0.5;
                }

                await this.userService.updateUserStreak(appeal.userId, newStreak, true);
            }
        }

        return updatedAppeal;
    }
}
