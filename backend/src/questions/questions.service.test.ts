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
        it('deberia retornar una pregunta aleatoria', async () => {
            const mockQuestions: any[] = [
                { _id: '1', text: 'q1', topic: 't1' },
                { _id: '2', text: 'q2', topic: 't2' }
            ];
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue(mockQuestions);

            // Mock Math.random to return something predictable only because logic depends on it
            // However, since we just check if it returns *one of* the questions, strict equality on the result object is enough if we trust array access.
            // Let's just check it returns one of them.

            const result = await service.getRandomQuestion();

            expect(mockQuestions).toContain(result);
        });
    });
});
