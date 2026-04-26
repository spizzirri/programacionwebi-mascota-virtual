import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from "./questions.service";
import { QuestionService } from "./services/question.service";
import { UserService } from "../users/services/user.service";
import { AnswerService } from "../answers/services/answer.service";

describe('QuestionsService', () => {
    let service: QuestionsService;
    let questionService: QuestionService;
    let userService: UserService;
    let answerService: AnswerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionsService,
                {
                    provide: QuestionService,
                    useValue: {
                        getAllQuestions: jest.fn<any>().mockResolvedValue([]),
                        createQuestion: jest.fn<any>().mockResolvedValue({} as any),
                        getQuestionById: jest.fn<any>(),
                        getAllTopics: jest.fn<any>().mockResolvedValue([]),
                        upsertTopic: jest.fn<any>().mockResolvedValue({} as any),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findUserById: jest.fn(),
                        assignQuestionToUser: jest.fn(),
                    },
                },
                {
                    provide: AnswerService,
                    useValue: {
                        getAnswerForQuestionToday: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<QuestionsService>(QuestionsService);
        questionService = module.get<QuestionService>(QuestionService);
        userService = module.get<UserService>(UserService);
        answerService = module.get<AnswerService>(AnswerService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('onModuleInit', () => {

        it('deberia sincronizar tópicos al inicializar el módulo', async () => {
            const upsertTopicSpy = jest.spyOn(questionService, 'upsertTopic');
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([{ topic: 't1' }] as any);

            await service.onModuleInit();

            expect(questionService.getAllQuestions).toHaveBeenCalled();
            expect(upsertTopicSpy).toHaveBeenCalledWith('t1');
        });
    });

    describe('getRandomQuestion', () => {
        it('deberia asignar y retornar una nueva pregunta cuando no hay pregunta asignada', async () => {
            jest.spyOn(userService, 'findUserById').mockResolvedValue({} as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([{ _id: 'q1', topic: 't1' }] as any);
            jest.spyOn(questionService, 'getAllTopics').mockResolvedValue([{ name: 't1', enabled: true }] as any);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue(null as any);
            const assignSpy = jest.spyOn(userService, 'assignQuestionToUser').mockResolvedValue(undefined);

            const result = await service.getRandomQuestion('user123');

            expect(result.question).toEqual({ _id: 'q1', topic: 't1' });
            expect(assignSpy).toHaveBeenCalledWith('user123', 'q1');
        });

        it('deberia retornar la misma pregunta si ya fue asignada hoy', async () => {
            const today = new Date();
            const user = {
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: today,
            };
            jest.spyOn(userService, 'findUserById').mockResolvedValue(user as any);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue({ _id: 'q1', text: 'Q?', topic: 't1' } as any);
            jest.spyOn(answerService, 'getAnswerForQuestionToday').mockResolvedValue(null);

            const result = await service.getRandomQuestion('user123');

            expect(result.question._id).toBe('q1');
        });

        it('deberia asignar nueva pregunta si la asignacion fue ayer', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const user = {
                currentQuestionId: 'q1',
                lastQuestionAssignedAt: yesterday,
            };
            jest.spyOn(userService, 'findUserById').mockResolvedValue(user as any);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue(null as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([{ _id: 'q2', topic: 't1' }] as any);
            jest.spyOn(questionService, 'getAllTopics').mockResolvedValue([{ name: 't1', enabled: true }] as any);
            const assignSpy = jest.spyOn(userService, 'assignQuestionToUser').mockResolvedValue(undefined);

            await service.getRandomQuestion('user123');

            expect(assignSpy).toHaveBeenCalledWith('user123', 'q2');
        });

        it('deberia filtrar preguntas de topicos deshabilitados', async () => {
            jest.spyOn(userService, 'findUserById').mockResolvedValue({} as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([
                { _id: 'q1', topic: 'disabled' },
                { _id: 'q2', topic: 'enabled' }
            ] as any);
            jest.spyOn(questionService, 'getAllTopics').mockResolvedValue([
                { name: 'disabled', enabled: false },
                { name: 'enabled', enabled: true }
            ] as any);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue(null as any);

            const result = await service.getRandomQuestion('user123');

            expect(result.question.topic).toBe('enabled');
        });

        it('deberia lanzar error cuando no hay preguntas en la base de datos', async () => {
            jest.spyOn(userService, 'findUserById').mockResolvedValue({} as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([]);
            jest.spyOn(questionService, 'getAllTopics').mockResolvedValue([]);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue(null as any);

            await expect(service.getRandomQuestion('user123')).rejects.toThrow('No questions available');
        });

        it('deberia usar fallback a todas las preguntas cuando no hay topicos activos', async () => {
            jest.spyOn(userService, 'findUserById').mockResolvedValue({} as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([{ _id: 'q1', topic: 't1' }] as any);
            jest.spyOn(questionService, 'getAllTopics').mockResolvedValue([{ name: 't1', enabled: false }] as any);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue(null as any);

            const result = await service.getRandomQuestion('user123');

            expect(result.question._id).toBe('q1');
        });

        it('deberia delegar al QuestionerForProfessor cuando el usuario es profesor', async () => {
            jest.spyOn(userService, 'findUserById').mockResolvedValue({ role: 'PROFESSOR' } as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([
                { _id: 'q1', topic: 't1' },
                { _id: 'q2', topic: 't2' }
            ] as any);
            jest.spyOn(questionService, 'getAllTopics').mockResolvedValue([{ name: 't1', enabled: true }] as any);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue({ _id: 'q1', topic: 't1' } as any);
            jest.spyOn(answerService, 'getAnswerForQuestionToday').mockResolvedValue({ _id: 'a1' } as any);
            const assignSpy = jest.spyOn(userService, 'assignQuestionToUser').mockResolvedValue(undefined);

            const result = await service.getRandomQuestion('prof1');

            expect(result.question).toBeDefined();
            expect(result.hasAnswered).toBe(false);
            expect(assignSpy).toHaveBeenCalled();
        });

        it('deberia delegar al QuestionerForStudent cuando el usuario es estudiante', async () => {
            jest.spyOn(userService, 'findUserById').mockResolvedValue({ role: 'STUDENT' } as any);
            jest.spyOn(questionService, 'getQuestionById').mockResolvedValue({ _id: 'q1', topic: 't1' } as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([{ _id: 'q1', topic: 't1' }] as any);
            jest.spyOn(questionService, 'getAllTopics').mockResolvedValue([{ name: 't1', enabled: true }] as any);
            jest.spyOn(answerService, 'getAnswerForQuestionToday').mockResolvedValue(null);

            const result = await service.getRandomQuestion('student1');

            expect(result.question._id).toBe('q1');
            expect(result.hasAnswered).toBe(false);
        });
    });
});
