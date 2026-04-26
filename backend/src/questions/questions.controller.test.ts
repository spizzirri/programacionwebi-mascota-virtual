import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { QuestionService } from "./services/question.service";
import { ProfessorGuard } from '../common/guards/professor.guard';
import { DatabaseService } from '../database/database.service';

describe('QuestionsController', () => {
    let controller: QuestionsController;
    let questionsService: QuestionsService;
    let questionService: QuestionService;

    const mockQuestionService = {
        getAllQuestions: jest.fn<any>(),
        getAllQuestionsPaginated: jest.fn<any>(),
        createQuestion: jest.fn<any>(),
        updateQuestion: jest.fn<any>(),
        deleteQuestion: jest.fn<any>(),
        createQuestions: jest.fn<any>(),
        deleteAllQuestions: jest.fn<any>(),
        getAllTopics: jest.fn<any>(),
        updateTopic: jest.fn<any>(),
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
                    provide: QuestionService,
                    useValue: mockQuestionService,
                },
                {
                    provide: ProfessorGuard,
                    useValue: { canActivate: jest.fn().mockReturnValue(true) },
                },
                {
                    provide: DatabaseService,
                    useValue: {},
                },
            ],
        }).overrideGuard(ProfessorGuard).useValue({ canActivate: jest.fn().mockReturnValue(true) }).compile();

        controller = module.get<QuestionsController>(QuestionsController);
        questionsService = module.get<QuestionsService>(QuestionsService);
        questionService = module.get<QuestionService>(QuestionService);
    });

    describe('getRandomQuestion', () => {
        it('deberia retornar una pregunta si el usuario esta autenticado', async () => {
            const session: any = { userId: 'user123' };
            const mockQuestion = { _id: '1', text: 'Question?', topic: 'HTML' };
            const mockResponse = { question: mockQuestion, hasAnswered: false };

            jest.spyOn(questionsService, 'getRandomQuestion').mockResolvedValue(mockResponse as any);

            const result = await controller.getRandomQuestion(session);

            expect(result).toEqual(mockResponse);
            expect(questionsService.getRandomQuestion).toHaveBeenCalled();
        });

        it('deberia lanzar Error si no hay userId en la sesion', async () => {
            const session: any = {};

            await expect(controller.getRandomQuestion(session)).rejects.toThrow('Not authenticated');
        });
    });

    describe('ABMC', () => {
        const mockQuestions = [{ _id: '1', text: 'Q1' }];

        it('getAllQuestions should return paginated questions', async () => {
            mockQuestionService.getAllQuestionsPaginated.mockResolvedValue({ data: mockQuestions, total: 1 });

            const result = await controller.getAllQuestions('1', '10');
            expect(result.questions.data).toEqual(mockQuestions);
            expect(result.questions.meta.page).toBe(1);
        });

        it('createQuestion should create and return question', async () => {
            mockQuestionService.createQuestion.mockResolvedValue(mockQuestions[0] as any);

            const result = await controller.createQuestion({ text: 'Q1', topic: 'html' } as any);
            expect(result).toEqual({ question: mockQuestions[0] });
        });

        it('updateQuestion should update and return question', async () => {
            mockQuestionService.updateQuestion.mockResolvedValue(mockQuestions[0] as any);

            const result = await controller.updateQuestion('1', { text: 'Updated' } as any);
            expect(result).toEqual({ question: mockQuestions[0] });
        });

        it('deleteQuestion should delete', async () => {
            mockQuestionService.deleteQuestion.mockResolvedValue(undefined);

            const result = await controller.deleteQuestion('1');
            expect(result).toEqual({ success: true });
        });

        it('createQuestionsBulk deberia crear todas', async () => {
            mockQuestionService.createQuestions.mockResolvedValue(mockQuestions as any);

            const result = await controller.createQuestionsBulk({ questions: mockQuestions } as any);
            expect(result).toEqual({ questions: mockQuestions });
        });

        it('deleteAllQuestions deberia borrar todas', async () => {
            mockQuestionService.deleteAllQuestions.mockResolvedValue(undefined);

            const result = await controller.deleteAllQuestions();
            expect(result).toEqual({ success: true });
        });
    });
});
