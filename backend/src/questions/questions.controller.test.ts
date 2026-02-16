import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

describe('QuestionsController', () => {
    let controller: QuestionsController;
    let service: QuestionsService;
    let databaseService: DatabaseService;

    const mockDbService = {
        getAllQuestions: jest.fn<() => Promise<any>>(),
        createQuestion: jest.fn<() => Promise<any>>(),
        updateQuestion: jest.fn<() => Promise<any>>(),
        deleteQuestion: jest.fn<() => Promise<any>>(),
        findUserById: jest.fn<() => Promise<any>>(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuestionsController],
            providers: [
                {
                    provide: QuestionsService,
                    useValue: {
                        getRandomQuestion: jest.fn(),
                    },
                },
                {
                    provide: DatabaseService,
                    useValue: mockDbService,
                },
            ],
        }).compile();

        controller = module.get<QuestionsController>(QuestionsController);
        service = module.get<QuestionsService>(QuestionsService);
        databaseService = module.get<DatabaseService>(DatabaseService);
    });

    describe('getRandomQuestion', () => {
        it('deberia retornar una pregunta si el usuario esta autenticado', async () => {
            const session: any = { userId: 'user123' };
            const mockQuestion = { _id: '1', text: 'Question?', topic: 'HTML' };
            const mockResponse = { question: mockQuestion, hasAnswered: false };

            jest.spyOn(service, 'getRandomQuestion').mockResolvedValue(mockResponse as any);

            const result = await controller.getRandomQuestion(session);

            expect(result).toEqual(mockResponse);
            expect(service.getRandomQuestion).toHaveBeenCalled();
        });

        it('deberia lanzar HttpException UNAUTHORIZED si no hay userId en la sesion', async () => {
            const session: any = {};

            await expect(controller.getRandomQuestion(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });
    });

    describe('ABMC', () => {
        const session = { userId: 'prof-id' };
        const mockQuestions = [{ _id: '1', text: 'Q1' }];

        it('getAllQuestions should return questions if PROFESSOR', async () => {
            mockDbService.findUserById.mockResolvedValue({ role: 'PROFESSOR' } as any);
            mockDbService.getAllQuestions.mockResolvedValue(mockQuestions as any);

            const result = await controller.getAllQuestions(session as any);
            expect(result).toEqual({ questions: mockQuestions });
        });

        it('createQuestion should create and return question if PROFESSOR', async () => {
            mockDbService.findUserById.mockResolvedValue({ role: 'PROFESSOR' } as any);
            mockDbService.createQuestion.mockResolvedValue(mockQuestions[0] as any);

            const result = await controller.createQuestion(session as any, { text: 'Q1' });
            expect(result).toEqual({ question: mockQuestions[0] });
        });

        it('updateQuestion should update and return question if PROFESSOR', async () => {
            mockDbService.findUserById.mockResolvedValue({ role: 'PROFESSOR' } as any);
            mockDbService.updateQuestion.mockResolvedValue(mockQuestions[0] as any);

            const result = await controller.updateQuestion(session as any, '1', { text: 'Updated' });
            expect(result).toEqual({ question: mockQuestions[0] });
        });

        it('deleteQuestion should delete if PROFESSOR', async () => {
            mockDbService.findUserById.mockResolvedValue({ role: 'PROFESSOR' } as any);
            mockDbService.deleteQuestion.mockResolvedValue(undefined);

            const result = await controller.deleteQuestion(session as any, '1');
            expect(result).toEqual({ success: true });
        });

        it('should throw FORBIDDEN if NOT PROFESSOR', async () => {
            mockDbService.findUserById.mockResolvedValue({ role: 'STUDENT' } as any);

            await expect(controller.getAllQuestions(session as any)).rejects.toThrow(
                new HttpException('Forbidden: Only professors can access this resource', HttpStatus.FORBIDDEN)
            );
        });
    });
});
