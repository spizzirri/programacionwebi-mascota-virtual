import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Appeal } from '../database/schemas/appeal.schema';

@Injectable()
export class AppealsService {
    constructor(private readonly db: DatabaseService) { }

    async createAppeal(userId: string, userName: string, answerId: string) {
        const answers = await this.db.getAnswersByUserId(userId);
        const answer = answers.find(a => a._id.toString() === answerId);

        if (!answer) {
            throw new NotFoundException('Respuesta no encontrada');
        }

        return this.db.createAppeal({
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
            streakAtMoment: (answer as any).streakAtMoment || 0,
        });
    }

    async getMyAppeals(userId: string) {
        return this.db.getAppealsByUserId(userId);
    }

    async getAllAppeals() {
        return this.db.getAllAppeals();
    }

    async resolveAppeal(appealId: string, status: 'accepted' | 'rejected', professorFeedback: string) {
        const appeal = await this.db.getAppealById(appealId);
        if (!appeal) {
            throw new NotFoundException('Apelación no encontrada');
        }

        const updatedAppeal = await this.db.updateAppeal(appealId, {
            status,
            professorFeedback,
            resolvedAt: new Date(),
        });

        if (status === 'accepted') {
            const user = await this.db.findUserById(appeal.userId);
            if (user) {
                let newStreak = user.streak;

                if (appeal.originalRating === 'incorrect') {
                    // Si era incorrecta (streak se reseteó a 0), sumamos:
                    // Lo que tenía antes (streakAtMoment) + 1 (por esta respuesta corregida) + lo que avanzó después (user.streak)
                    newStreak = appeal.streakAtMoment + 1 + user.streak;
                } else if (appeal.originalRating === 'partial') {
                    // Si era parcial (sumó 0.5) y ahora es aceptada (sumaría 1),
                    // simplemente le sumamos el 0.5 que le faltaba sobre su racha actual
                    newStreak = user.streak + 0.5;
                }

                await this.db.updateUserStreak(appeal.userId, newStreak, true);
            }
        }

        return updatedAppeal;
    }
}
