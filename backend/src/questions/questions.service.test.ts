import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from "./questions.service";
import { DatabaseService } from "../database/database.service";

describe('QuestionsService', () => {
    let service: QuestionsService;
    let databaseService: DatabaseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionsService,
                {
                    provide: DatabaseService,
                    useValue: {
                        getAllQuestions: jest.fn(),
                        createQuestion: jest.fn(),
                        findUserById: jest.fn(),
                        getQuestionById: jest.fn(),
                        assignQuestionToUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<QuestionsService>(QuestionsService);
        databaseService = module.get<DatabaseService>(DatabaseService);
    });

    describe('onModuleInit', () => {
        it('deberia sembrar preguntas si la base de datos esta vacia', async () => {
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue([]);
            const createQuestionSpy = jest.spyOn(databaseService, 'createQuestion').mockResolvedValue({} as any);

            await service.onModuleInit();

            expect(databaseService.getAllQuestions).toHaveBeenCalled();
            expect(createQuestionSpy).toHaveBeenCalled();
        });

        it('no deberia sembrar preguntas si la base de datos ya tiene preguntas', async () => {
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue([{ _id: '1', text: 'q1', topic: 't1' }] as any);
            const createQuestionSpy = jest.spyOn(databaseService, 'createQuestion');

            await service.onModuleInit();

            expect(databaseService.getAllQuestions).toHaveBeenCalled();
            expect(createQuestionSpy).not.toHaveBeenCalled();
        });
    });

    describe('getRandomQuestion', () => {
        const userId = 'user-123';
        const mockQuestions: any[] = [
            { _id: 'q1', text: 'question 1', topic: 'html' },
            { _id: 'q2', text: 'question 2', topic: 'css' }
        ];

        beforeEach(() => {
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue(mockQuestions);
            jest.spyOn(databaseService, 'assignQuestionToUser').mockResolvedValue(undefined);
        });

        it('dado que no hay pregunta asignada cuando se solicita una pregunta entonces se asigna y retorna una nueva', async () => {
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);

            const result = await service.getRandomQuestion(userId);

            expect(mockQuestions).toContain(result);
            expect(databaseService.assignQuestionToUser).toHaveBeenCalledWith(userId, (result as any)._id);
        });

        it('dado una pregunta asignada hoy cuando se solicita otra pregunta entonces se retorna la misma', async () => {
            const today = new Date();
            const mockUser = {
                _id: userId,
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: today
            };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(databaseService, 'getQuestionById').mockResolvedValue(mockQuestions[0]);

            const result = await service.getRandomQuestion(userId);

            expect(result).toEqual(mockQuestions[0]);
            expect(databaseService.getQuestionById).toHaveBeenCalledWith('q1');
            expect(databaseService.assignQuestionToUser).not.toHaveBeenCalled();
        });

        it('dado una pregunta asignada ayer cuando se solicita otra pregunta entonces se retorna una nueva', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const mockUser = {
                _id: userId,
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: yesterday
            };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);

            const result = await service.getRandomQuestion(userId);

            expect(mockQuestions).toContain(result);
            expect(databaseService.assignQuestionToUser).toHaveBeenCalledWith(userId, (result as any)._id);
        });
    });
});
