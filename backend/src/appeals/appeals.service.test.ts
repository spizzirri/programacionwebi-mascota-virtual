import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { AppealsService } from "./appeals.service";
import { AppealService } from "./services/appeal.service";
import { AnswerService } from "../answers/services/answer.service";
import { UserService } from "../users/services/user.service";
import { NotFoundException } from "@nestjs/common";
import { Answer } from "../database/schemas/answer.schema";
import { Appeal } from "../database/schemas/appeal.schema";
import { User } from "../database/schemas/user.schema";

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
            const mockAnswers = [{ _id: { toString: () => 'a1' }, questionId: 'q1', questionText: 'Q?', userAnswer: 'A', rating: 'incorrect', feedback: 'no', streakAtMoment: 0 }];
            jest.spyOn(answerService, 'getAnswersByUserId').mockResolvedValue(mockAnswers as unknown as any[]);
            jest.spyOn(appealService, 'createAppeal').mockResolvedValue({ _id: { toString: () => 'ap1' } } as unknown as any);

            const result = await service.createAppeal('u1', 'user@test.com', 'a1');

            expect(result._id.toString()).toBe('ap1');
        });

        it('deberia lanzar NotFoundException si la respuesta no existe', async () => {
            jest.spyOn(answerService, 'getAnswersByUserId').mockResolvedValue([]);

            await expect(service.createAppeal('u1', 'user@test.com', 'nonexistent'))
                .rejects.toThrow('Respuesta no encontrada');
        });
    });

    describe('getMyAppeals', () => {
        it('deberia retornar las apelaciones del usuario', async () => {
            const mockAppeals = [{ _id: { toString: () => 'ap1' } }] as unknown as any[];
            jest.spyOn(appealService, 'getAppealsByUserId').mockResolvedValue(mockAppeals);

            const result = await service.getMyAppeals('u1');

            expect(result).toEqual(mockAppeals);
        });
    });

    describe('getAllAppeals', () => {
        it('deberia retornar todas las apelaciones', async () => {
            const mockAppeals = [{ _id: { toString: () => 'ap1' } }] as unknown as any[];
            jest.spyOn(appealService, 'getAllAppeals').mockResolvedValue(mockAppeals);

            const result = await service.getAllAppeals();

            expect(result).toEqual(mockAppeals);
        });
    });

    describe('resolveAppeal', () => {
        it('deberia lanzar NotFoundException si la apelacion no existe', async () => {
            jest.spyOn(appealService, 'getAppealById').mockResolvedValue(null);

            await expect(service.resolveAppeal('nonexistent', 'accepted', 'feedback'))
                .rejects.toThrow('Apelación no encontrada');
        });

        it('deberia recuperar la racha correctamente para una respuesta incorrecta aceptada (escenario del usuario)\n            Escenario:\n                1. Tenía 10 de racha (streakAtMoment: 10)\n                2. Respondió mal (originalRating: incorrect)\n                3. Pasaron 3 días y el usuario volvió a jugar, tiene 3 de racha actual (user.streak: 3)\n                4. Se acepta la apelación.\n                Resultado esperado: 10 + 1 + 3 = 14.\n            ', async () => {
            const mockAppeal = {
                _id: { toString: () => 'ap1' },
                userId: 'u1',
                originalRating: 'incorrect',
                streakAtMoment: 10,
            } as unknown as Appeal;
            const mockUser = { streak: 3 } as unknown as User;
            // @ts-ignore - Mock for testing
            jest.spyOn(appealService, 'getAppealById').mockResolvedValue(mockAppeal);
            // @ts-ignore - Mock for testing
            jest.spyOn(appealService, 'updateAppeal').mockResolvedValue(mockAppeal);
            // @ts-ignore - Mock for testing
            jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
            const updateStreakSpy = jest.spyOn(userService, 'updateUserStreak').mockResolvedValue(undefined);

            await service.resolveAppeal('ap1', 'accepted', 'feedback');

            expect(updateStreakSpy).toHaveBeenCalledWith('u1', 14, true);
        });

        it('deberia actualizar la racha correctamente para una respuesta parcial aceptada\n            Escenario:\n                1. Tenía racha de 5.\n                2. Respondió parcial (+0.5). El sistema ya le dio 0.5. Current streak is 5.5.\n                3. Se acepta la apelación (debería ser +1 en total, o sea +0.5 sobre lo actual).\n                Resultado esperado: 5.5 + 0.5 = 6.\n            ', async () => {
            const mockAppeal = {
                _id: { toString: () => 'ap1' },
                userId: 'u1',
                originalRating: 'partial',
                streakAtMoment: 5,
            } as unknown as Appeal;
            const mockUser = { streak: 5.5 } as unknown as User;
            // @ts-ignore - Mock for testing
            jest.spyOn(appealService, 'getAppealById').mockResolvedValue(mockAppeal);
            // @ts-ignore - Mock for testing
            jest.spyOn(appealService, 'updateAppeal').mockResolvedValue(mockAppeal);
            // @ts-ignore - Mock for testing
            jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
            const updateStreakSpy = jest.spyOn(userService, 'updateUserStreak').mockResolvedValue(undefined);

            await service.resolveAppeal('ap1', 'accepted', 'feedback');

            expect(updateStreakSpy).toHaveBeenCalledWith('u1', 6, true);
        });

        it('no deberia actualizar la racha si la apelacion es rechazada', async () => {
            const mockAppeal = { _id: { toString: () => 'ap1' }, userId: 'u1', originalRating: 'incorrect' } as unknown as Appeal;
            // @ts-ignore - Mock for testing
            jest.spyOn(appealService, 'getAppealById').mockResolvedValue(mockAppeal);
            // @ts-ignore - Mock for testing
            jest.spyOn(appealService, 'updateAppeal').mockResolvedValue(mockAppeal);
            const updateStreakSpy = jest.spyOn(userService, 'updateUserStreak').mockResolvedValue(undefined);

            await service.resolveAppeal('ap1', 'rejected', 'feedback');

            expect(updateStreakSpy).not.toHaveBeenCalled();
        });

        it('deberia copiar streakAtMoment de la respuesta a la apelacion', async () => {
            const mockAnswers = [{ _id: { toString: () => 'a1' }, questionId: 'q1', questionText: 'Q?', userAnswer: 'A', rating: 'incorrect', feedback: 'no', streakAtMoment: 7 }] as unknown as any[];
            jest.spyOn(answerService, 'getAnswersByUserId').mockResolvedValue(mockAnswers);
            jest.spyOn(appealService, 'createAppeal').mockReturnValue(Promise.resolve({ streakAtMoment: 7 } as unknown as any));

            const result = await service.createAppeal('u1', 'user@test.com', 'a1');

            expect(result.streakAtMoment).toBe(7);
        });
    });
});
