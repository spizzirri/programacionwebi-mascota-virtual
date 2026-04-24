import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { AppealsService } from "./appeals.service";
import { AppealService } from "./services/appeal.service";
import { AnswerService } from "../answers/services/answer.service";
import { UserService } from "../users/services/user.service";
import { NotFoundException } from "@nestjs/common";

describe('AppealsService', () => {
    let service: AppealsService;
    let appealService: AppealService;
    let answerService: AnswerService;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppealsService,
                {
                    provide: AppealService,
                    useValue: {
                        getAppealById: jest.fn(),
                        updateAppeal: jest.fn(),
                        createAppeal: jest.fn(),
                        getAppealsByUserId: jest.fn(),
                        getAllAppeals: jest.fn(),
                        getAllAppealsPaginated: jest.fn(),
                    },
                },
                {
                    provide: AnswerService,
                    useValue: {
                        getAnswersByUserId: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findUserById: jest.fn(),
                        updateUserStreak: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AppealsService>(AppealsService);
        appealService = module.get<AppealService>(AppealService);
        answerService = module.get<AnswerService>(AnswerService);
        userService = module.get<UserService>(UserService);
    });

    describe('createAppeal', () => {
        it('deberia crear una apelacion correctamente', async () => {
            const mockAnswers = [{ _id: 'a1', questionId: 'q1', questionText: 'Q?', userAnswer: 'A', rating: 'incorrect', feedback: 'no' }];
            jest.spyOn(answerService as any, 'getAnswersByUserId').mockResolvedValue(mockAnswers as any);
            jest.spyOn(appealService as any, 'createAppeal').mockResolvedValue({ _id: 'ap1' } as any);

            const result = await service.createAppeal('u1', 'user@test.com', 'a1');

            expect(result._id).toBe('ap1');
        });

        it('deberia lanzar NotFoundException si la respuesta no existe', async () => {
            jest.spyOn(answerService as any, 'getAnswersByUserId').mockResolvedValue([]);

            await expect(service.createAppeal('u1', 'user@test.com', 'nonexistent'))
                .rejects.toThrow('Respuesta no encontrada');
        });
    });

    describe('getMyAppeals', () => {
        it('deberia retornar las apelaciones del usuario', async () => {
            const mockAppeals = [{ _id: 'ap1' }];
            jest.spyOn(appealService as any, 'getAppealsByUserId').mockResolvedValue(mockAppeals as any);

            const result = await service.getMyAppeals('u1');

            expect(result).toEqual(mockAppeals);
        });
    });

    describe('getAllAppeals', () => {
        it('deberia retornar todas las apelaciones', async () => {
            const mockAppeals = [{ _id: 'ap1' }];
            jest.spyOn(appealService as any, 'getAllAppeals').mockResolvedValue(mockAppeals as any);

            const result = await service.getAllAppeals();

            expect(result).toEqual(mockAppeals);
        });
    });

    describe('getAllAppealsPaginated', () => {
        it('deberia retornar apelaciones paginadas', async () => {
            const mockAppeals = [{ _id: 'ap1' }];
            jest.spyOn(appealService as any, 'getAllAppealsPaginated').mockResolvedValue({ data: mockAppeals, total: 1 });

            const result = await service.getAllAppealsPaginated(1, 10);

            expect(result.data).toEqual(mockAppeals);
            expect(result.total).toBe(1);
        });
    });

    describe('resolveAppeal', () => {
        it('deberia lanzar NotFoundException si la apelacion no existe', async () => {
            jest.spyOn(appealService as any, 'getAppealById').mockResolvedValue(null);

            await expect(service.resolveAppeal('nonexistent', 'accepted', 'feedback'))
                .rejects.toThrow('Apelación no encontrada');
        });

        it('deberia recuperar la racha correctamente para una respuesta incorrecta aceptada (escenario del usuario)\n            Escenario:\n                1. Tenía 10 de racha (streakAtMoment: 10)\n                2. Respondió mal (originalRating: incorrect)\n                3. Pasaron 3 días y el usuario volvió a jugar, tiene 3 de racha actual (user.streak: 3)\n                4. Se acepta la apelación.\n                Resultado esperado: 10 + 1 + 3 = 14.\n            ', async () => {
            const mockAppeal = {
                _id: 'ap1',
                userId: 'u1',
                originalRating: 'incorrect',
                streakAtMoment: 10,
            };
            const mockUser = { streak: 3 };
            jest.spyOn(appealService as any, 'getAppealById').mockResolvedValue(mockAppeal as any);
            jest.spyOn(appealService as any, 'updateAppeal').mockResolvedValue(mockAppeal as any);
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(mockUser as any);
            const updateStreakSpy = jest.spyOn(userService as any, 'updateUserStreak').mockResolvedValue(undefined);

            await service.resolveAppeal('ap1', 'accepted', 'feedback');

            expect(updateStreakSpy).toHaveBeenCalledWith('u1', 14, true);
        });

        it('deberia actualizar la racha correctamente para una respuesta parcial aceptada\n            Escenario:\n                1. Tenía racha de 5.\n                2. Respondió parcial (+0.5). El sistema ya le dio 0.5. Current streak is 5.5.\n                3. Se acepta la apelación (debería ser +1 en total, o sea +0.5 sobre lo actual).\n                Resultado esperado: 5.5 + 0.5 = 6.\n            ', async () => {
            const mockAppeal = {
                _id: 'ap1',
                userId: 'u1',
                originalRating: 'partial',
                streakAtMoment: 5,
            };
            const mockUser = { streak: 5.5 };
            jest.spyOn(appealService as any, 'getAppealById').mockResolvedValue(mockAppeal as any);
            jest.spyOn(appealService as any, 'updateAppeal').mockResolvedValue(mockAppeal as any);
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(mockUser as any);
            const updateStreakSpy = jest.spyOn(userService as any, 'updateUserStreak').mockResolvedValue(undefined);

            await service.resolveAppeal('ap1', 'accepted', 'feedback');

            expect(updateStreakSpy).toHaveBeenCalledWith('u1', 6, true);
        });

        it('no deberia actualizar la racha si la apelacion es rechazada', async () => {
            const mockAppeal = { _id: 'ap1', userId: 'u1', originalRating: 'incorrect' };
            jest.spyOn(appealService as any, 'getAppealById').mockResolvedValue(mockAppeal as any);
            jest.spyOn(appealService as any, 'updateAppeal').mockResolvedValue(mockAppeal as any);
            const updateStreakSpy = jest.spyOn(userService as any, 'updateUserStreak').mockResolvedValue(undefined);

            await service.resolveAppeal('ap1', 'rejected', 'feedback');

            expect(updateStreakSpy).not.toHaveBeenCalled();
        });

        it('deberia copiar streakAtMoment de la respuesta a la apelacion', async () => {
            const mockAnswers = [{ _id: 'a1', questionId: 'q1', questionText: 'Q?', userAnswer: 'A', rating: 'incorrect', feedback: 'no', streakAtMoment: 7 }];
            jest.spyOn(answerService as any, 'getAnswersByUserId').mockResolvedValue(mockAnswers as any);
            jest.spyOn(appealService as any, 'createAppeal').mockImplementation((data: any) => Promise.resolve(data));

            const result = await service.createAppeal('u1', 'user@test.com', 'a1');

            expect(result.streakAtMoment).toBe(7);
        });
    });
});
