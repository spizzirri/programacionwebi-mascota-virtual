import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { AppealsService } from "./appeals.service";
import { DatabaseService } from "../database/database.service";
import { NotFoundException } from "@nestjs/common";

describe('AppealsService', () => {
    let service: AppealsService;
    let databaseService: DatabaseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppealsService,
                {
                    provide: DatabaseService,
                    useValue: {
                        getAppealById: jest.fn(),
                        updateAppeal: jest.fn(),
                        findUserById: jest.fn(),
                        updateUserStreak: jest.fn(),
                        getAnswersByUserId: jest.fn(),
                        createAppeal: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AppealsService>(AppealsService);
        databaseService = module.get<DatabaseService>(DatabaseService);
    });

    describe('resolveAppeal', () => {
        it('deberia lanzar NotFoundException si la apelacion no existe', async () => {
            jest.spyOn(databaseService, 'getAppealById').mockResolvedValue(null);

            await expect(service.resolveAppeal('a1', 'accepted', 'feedback'))
                .rejects.toThrow(NotFoundException);
        });

        it(`deberia recuperar la racha correctamente para una respuesta incorrecta aceptada (escenario del usuario)
            Escenario:
                1. Tenía 10 de racha (streakAtMoment: 10)
                2. Respondió mal (originalRating: incorrect)
                3. Pasaron 3 días y el usuario volvió a jugar, tiene 3 de racha actual (user.streak: 3)
                4. Se acepta la apelación.
                Resultado esperado: 10 + 1 + 3 = 14.
            
            `, async () => {

            const mockAppeal = {
                _id: 'a1',
                userId: 'u1',
                originalRating: 'incorrect',
                streakAtMoment: 10,
                status: 'pending'
            };

            const mockUser = {
                _id: 'u1',
                streak: 3
            };

            jest.spyOn(databaseService, 'getAppealById').mockResolvedValue(mockAppeal as any);
            jest.spyOn(databaseService, 'updateAppeal').mockResolvedValue({ ...mockAppeal, status: 'accepted' } as any);
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            const updateStreakSpy = jest.spyOn(databaseService, 'updateUserStreak').mockResolvedValue(undefined);

            await service.resolveAppeal('a1', 'accepted', 'Excelente apelación');

            expect(updateStreakSpy).toHaveBeenCalledWith('u1', 14, true);
        });

        it(`deberia actualizar la racha correctamente para una respuesta parcial aceptada
            Escenario:
                1. Tenía racha de 5.
                2. Respondió parcial (+0.5). El sistema ya le dio 0.5. Current streak is 5.5.
                3. Se acepta la apelación (debería ser +1 en total, o sea +0.5 sobre lo actual).
                Resultado esperado: 5.5 + 0.5 = 6.`
            , async () => {

                const mockAppeal = {
                    _id: 'a1',
                    userId: 'u1',
                    originalRating: 'partial',
                    streakAtMoment: 5,
                    status: 'pending'
                };

                const mockUser = {
                    _id: 'u1',
                    streak: 5.5
                };

                jest.spyOn(databaseService, 'getAppealById').mockResolvedValue(mockAppeal as any);
                jest.spyOn(databaseService, 'updateAppeal').mockResolvedValue({ ...mockAppeal, status: 'accepted' } as any);
                jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
                const updateStreakSpy = jest.spyOn(databaseService, 'updateUserStreak').mockResolvedValue(undefined);

                await service.resolveAppeal('a1', 'accepted', 'Ok');

                expect(updateStreakSpy).toHaveBeenCalledWith('u1', 6, true);
            });

        it('no deberia actualizar la racha si la apelacion es rechazada', async () => {
            const mockAppeal = {
                _id: 'a1',
                userId: 'u1',
                status: 'pending'
            };

            jest.spyOn(databaseService, 'getAppealById').mockResolvedValue(mockAppeal as any);
            jest.spyOn(databaseService, 'updateAppeal').mockResolvedValue({ ...mockAppeal, status: 'rejected' } as any);
            const findUserSpy = jest.spyOn(databaseService, 'findUserById');

            await service.resolveAppeal('a1', 'rejected', 'No corresponde');

            expect(findUserSpy).not.toHaveBeenCalled();
            expect(databaseService.updateUserStreak).not.toHaveBeenCalled();
        });
    });

    describe('createAppeal', () => {
        it('deberia copiar streakAtMoment de la respuesta a la apelacion', async () => {
            const mockAnswer = {
                _id: 'ans1',
                userId: 'u1',
                questionId: 'q1',
                rating: 'incorrect',
                feedback: 'mal',
                streakAtMoment: 7
            };

            jest.spyOn(databaseService, 'getAnswersByUserId').mockResolvedValue([mockAnswer] as any);
            const createAppealSpy = jest.spyOn(databaseService, 'createAppeal').mockResolvedValue({} as any);

            await service.createAppeal('u1', 'User', 'ans1');

            expect(createAppealSpy).toHaveBeenCalledWith(expect.objectContaining({
                streakAtMoment: 7
            }));
        });
    });
});
