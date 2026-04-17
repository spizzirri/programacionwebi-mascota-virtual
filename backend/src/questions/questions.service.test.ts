import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
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
                        getAllQuestions: jest.fn<any>().mockResolvedValue([]),
                        createQuestion: jest.fn<any>().mockResolvedValue({} as any),
                        findUserById: jest.fn(),
                        getQuestionById: jest.fn(),
                        assignQuestionToUser: jest.fn(),
                        getAnswerForQuestionToday: jest.fn(),
                        getAllTopics: jest.fn<any>().mockResolvedValue([]),
                        upsertTopic: jest.fn<any>().mockResolvedValue({} as any),
                    },
                },
            ],
        }).compile();

        service = module.get<QuestionsService>(QuestionsService);
        databaseService = module.get<DatabaseService>(DatabaseService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('onModuleInit', () => {

        it('deberia sincronizar tópicos al inicializar el módulo', async () => {
            const upsertTopicSpy = jest.spyOn(databaseService, 'upsertTopic');
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue([{ topic: 't1' }] as any);

            await service.onModuleInit();

            expect(databaseService.getAllQuestions).toHaveBeenCalled();
            expect(upsertTopicSpy).toHaveBeenCalledWith('t1');
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
            jest.spyOn(databaseService, 'getAllTopics').mockResolvedValue(mockQuestions.map(q => ({ name: q.topic, enabled: true })) as any);
            jest.spyOn(databaseService, 'assignQuestionToUser').mockResolvedValue(undefined);
        });

        it('deberia asignar y retornar una nueva pregunta cuando no hay pregunta asignada', async () => {
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue(null);

            const result = await service.getRandomQuestion(userId);

            expect(mockQuestions).toContain(result.question);
            expect(result.hasAnswered).toBe(false);
            expect(databaseService.assignQuestionToUser).toHaveBeenCalledWith(userId, (result.question as any)._id);
        });

        it('deberia retornar la misma pregunta si ya fue asignada hoy', async () => {
            const today = new Date();
            const mockUser = {
                _id: userId,
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: today
            };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(databaseService, 'getQuestionById').mockResolvedValue(mockQuestions[0]);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue(null);

            const result = await service.getRandomQuestion(userId);

            expect(result.question).toEqual(mockQuestions[0]);
            expect(result.hasAnswered).toBe(false);
            expect(databaseService.getQuestionById).toHaveBeenCalledWith('q1');
            expect(databaseService.assignQuestionToUser).not.toHaveBeenCalled();
        });

        it('deberia asignar nueva pregunta si la asignacion fue ayer', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const mockUser = {
                _id: userId,
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: yesterday
            };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue(null);

            const result = await service.getRandomQuestion(userId);

            expect(mockQuestions).toContain(result.question);
            expect(result.hasAnswered).toBe(false);
            expect(databaseService.assignQuestionToUser).toHaveBeenCalledWith(userId, (result.question as any)._id);
        });

        it('deberia filtrar preguntas de topicos deshabilitados', async () => {
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue(null);

            jest.spyOn(databaseService, 'getAllTopics').mockResolvedValue([
                { name: 'html', enabled: true },
                { name: 'css', enabled: false }
            ] as any);

            const result = await service.getRandomQuestion(userId);

            expect(result.question.topic).toBe('html');
            expect((result.question as any)._id).toBe('q1');
        });

        it('deberia lanzar error cuando no hay preguntas en la base de datos', async () => {
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue([]);
            jest.spyOn(databaseService, 'getAllTopics').mockResolvedValue([]);

            await expect(service.getRandomQuestion(userId)).rejects.toThrow('No questions available in the database');
        });

        it('deberia usar fallback a todas las preguntas cuando no hay topicos activos', async () => {
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue(null);
            jest.spyOn(databaseService, 'getAllTopics').mockResolvedValue([
                { name: 'html', enabled: false },
                { name: 'css', enabled: false }
            ] as any);

            const result = await service.getRandomQuestion(userId);

            expect(mockQuestions).toContain(result.question);
            expect(result.hasAnswered).toBe(false);
        });

        it('deberia delegar al QuestionerForProfessor cuando el usuario es profesor', async () => {
            const today = new Date();
            const mockUser = {
                _id: userId,
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: today,
                role: 'PROFESSOR'
            };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(databaseService, 'getQuestionById').mockResolvedValue(mockQuestions[0]);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue({ _id: 'a1', rating: 'correct' } as any);
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue(mockQuestions);

            const result = await service.getRandomQuestion(userId);

            expect((result.question as any)._id).toBe('q2');
            expect(result.hasAnswered).toBe(false);
        });

        it('deberia delegar al QuestionerForStudent cuando el usuario es estudiante', async () => {
            const today = new Date();
            const mockUser = {
                _id: userId,
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: today,
                role: 'STUDENT'
            };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(databaseService, 'getQuestionById').mockResolvedValue(mockQuestions[0]);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue({ _id: 'a1', rating: 'incorrect' } as any);

            const result = await service.getRandomQuestion(userId);

            expect(result.question).toEqual(mockQuestions[0]);
            expect(result.hasAnswered).toBe(true);
            expect(result.answerId).toBe('a1');
            expect(result.rating).toBe('incorrect');
        });
    });
});
