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
                // Si era incorrecta (0), sumamos 1 (o 0.5 si queremos ser consistentes con la logic de AnswersService)
                // En AnswersService: correct -> +1, partial -> +0.5, incorrect -> reset to 0.
                // Si la apelación es aceptada, asumimos que debería haber sido 'correct'.
                // Si era 'incorrect' (0), ahora es 'correct' (+1).
                // Si era 'partial' (X), ahora es 'correct' (X+0.5).

                if (appeal.originalRating === 'incorrect') {
                    newStreak += 1;
                } else if (appeal.originalRating === 'partial') {
                    newStreak += 0.5;
                }

                await this.db.updateUserStreak(appeal.userId, newStreak, true);
            }
        }

        return updatedAppeal;
    }
}
