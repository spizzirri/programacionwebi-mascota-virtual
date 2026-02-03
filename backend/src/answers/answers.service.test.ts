import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { AnswersService } from "./answers.service";
import { DatabaseService } from "../database/database.service";

jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => {
            return {};
        })
    };
});

describe('AnswersService', () => {
    let service: AnswersService;
    let databaseService: DatabaseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnswersService,
                {
                    provide: DatabaseService,
                    useValue: {
                        findUserById: jest.fn(),
                        updateUserStreak: jest.fn(),
                        createAnswer: jest.fn(),
                        getAnswersByUserId: jest.fn(),
                        getAnswerForQuestionToday: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AnswersService>(AnswersService);
        databaseService = module.get<DatabaseService>(DatabaseService);
    });

    describe('submitAnswer', () => {
        it('deberia lanzar una excepcion si el usuario ya respondio hoy', async () => {
            (databaseService.getAnswerForQuestionToday as any).mockResolvedValue({ _id: 'a1' });

            await expect(service.submitAnswer('user123', 'q1', 'Question?', 'Answer'))
                .rejects.toThrow('Ya has respondido la pregunta del día, vuelve mañana');
        });

        it('deberia lanzar una excepcion si el usuario no es encontrado', async () => {
            jest.spyOn(service, 'validateAnswer').mockResolvedValue({
                rating: 'correct',
                feedback: 'Good job'
            });

            (databaseService.getAnswerForQuestionToday as any).mockResolvedValue(null);
            (databaseService.findUserById as any).mockResolvedValue(null);

            await expect(service.submitAnswer('user123', 'q1', 'Question?', 'Answer')).rejects.toThrow('User not found');
        });

        it('deberia incrementar la racha en 1 cuando la respuesta es correcta', async () => {
            jest.spyOn(service, 'validateAnswer').mockResolvedValue({
                rating: 'correct',
                feedback: 'Excellent'
            });

            const mockUser = { _id: 'user123', email: 'test@test.com', password: 'pwd', streak: 5, createdAt: new Date() };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(databaseService, 'getAnswerForQuestionToday').mockResolvedValue(null);
            const updateStreakSpy = jest.spyOn(databaseService, 'updateUserStreak').mockResolvedValue(undefined);
            const createAnswerSpy = jest.spyOn(databaseService, 'createAnswer').mockResolvedValue({
                userId: 'user123',
                questionId: 'q1',
                questionText: 'Question?',
                userAnswer: 'Answer',
                rating: 'correct',
                feedback: 'Excellent',
                timestamp: new Date()
            } as any);

            const result = await service.submitAnswer('user123', 'q1', 'Question?', 'Answer');

            expect(result.newStreak).toBe(6);
            expect(databaseService.updateUserStreak).toHaveBeenCalledWith('user123', 6);
            expect(databaseService.createAnswer).toHaveBeenCalledWith({
                userId: 'user123',
                questionId: 'q1',
                questionText: 'Question?',
                userAnswer: 'Answer',
                rating: 'correct',
                feedback: 'Excellent',
                timestamp: expect.any(Date)
            });
        });

        it('deberia incrementar la racha en 0.5 cuando la respuesta es parcial', async () => {
            jest.spyOn(service, 'validateAnswer').mockResolvedValue({
                rating: 'partial',
                feedback: 'Okay but...'
            });

            const mockUser = { _id: 'user123', email: 'test@test.com', password: 'pwd', streak: 5, createdAt: new Date() };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            const updateStreakSpy = jest.spyOn(databaseService, 'updateUserStreak').mockResolvedValue(undefined);
            jest.spyOn(databaseService, 'createAnswer').mockResolvedValue({
                userId: 'user123',
                questionId: 'q1',
                questionText: 'Question?',
                userAnswer: 'Answer',
                rating: 'partial',
                feedback: 'Okay but...',
                timestamp: new Date()
            } as any);

            const result = await service.submitAnswer('user123', 'q1', 'Question?', 'Answer');

            expect(result.newStreak).toBe(5.5);
            expect(databaseService.updateUserStreak).toHaveBeenCalledWith('user123', 5.5);
        });

        it('deberia reiniciar la racha a 0 cuando la respuesta es incorrecta', async () => {
            jest.spyOn(service, 'validateAnswer').mockResolvedValue({
                rating: 'incorrect',
                feedback: 'Wrong'
            });

            const mockUser = { _id: 'user123', email: 'test@test.com', password: 'pwd', streak: 5, createdAt: new Date() };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser as any);
            const updateStreakSpy = jest.spyOn(databaseService, 'updateUserStreak').mockResolvedValue(undefined);
            jest.spyOn(databaseService, 'createAnswer').mockResolvedValue({
                userId: 'user123',
                questionId: 'q1',
                questionText: 'Question?',
                userAnswer: 'Wrong',
                rating: 'incorrect',
                feedback: 'Wrong',
                timestamp: new Date()
            } as any);

            const result = await service.submitAnswer('user123', 'q1', 'Question?', 'Wrong');

            expect(result.newStreak).toBe(0);
            expect(databaseService.updateUserStreak).toHaveBeenCalledWith('user123', 0);
        });
    });

    describe('validateAnswer', () => {
        let originalEnv: NodeJS.ProcessEnv;

        beforeAll(() => {
            originalEnv = process.env;
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        beforeEach(() => {
            jest.clearAllMocks();
            process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
        });

        it('deberia lanzar error si Gemini client no esta configurado', async () => {
            (service as any).client = undefined;

            await expect(service.validateAnswer('q', 'a'))
                .rejects.toThrow('Gemini API not configured');
        });

        it('deberia retornar rating y feedback cuando la API responde correctamente', async () => {

            const mockGenerateContent = jest.fn<any>().mockResolvedValue({
                text: JSON.stringify({
                    rating: 'correct',
                    feedback: 'Muy bien'
                })
            });
            (service as any).client = {
                models: {
                    generateContent: mockGenerateContent
                }
            };

            const result = await service.validateAnswer('q', 'a');
            expect(result).toEqual({
                rating: 'correct',
                feedback: 'Muy bien'
            });
        });

        it('deberia enviar el prompt correcto a la API', async () => {

            const mockGenerateContent = jest.fn<any>().mockResolvedValue({
                text: JSON.stringify({ rating: 'correct', feedback: 'ok' })
            });

            (service as any).client = {
                models: {
                    generateContent: mockGenerateContent
                }
            };

            const questionText = '¿Qué es HTML?';
            const userAnswer = 'Es un lenguaje de marcado.';

            await service.validateAnswer(questionText, userAnswer);

            const expectedPrompt = `Eres un profesor de Programación Web I evaluando la respuesta de un estudiante.
        El nivel de la materia es básico, para principiantes que nunca han programado paginas web antes, por lo que no se espera que la respuesta sea compleja con un alto nivel de detalle.

        Pregunta: ${questionText}
        Respuesta del estudiante: ${userAnswer}

        Evalúa la respuesta y clasifícala en una de estas categorías:
        - "correct": La respuesta explica correctamente el concepto y es correcta y completa según el nivel de la materia
        - "partial": La respuesta explica parcialmente el concepto o no da ejemplos claros
        - "incorrect": La respuesta es incorrecta

        Responde ÚNICAMENTE en el siguiente formato JSON (sin markdown, sin bloques de código):
        {
        "rating": "correct" | "partial" | "incorrect",
        "feedback": "Breve explicación de no mas de 400 caracteres de por qué la respuesta es correcta/parcial/incorrecta"
        }`;

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: 'gemini-2.5-flash',
                contents: expectedPrompt,
            });
        });

        it('deberia limpiar bloques de codigo markdown de la respuesta', async () => {

            const mockGenerateContent = jest.fn<any>().mockResolvedValue({
                text: '```json\n{"rating": "partial", "feedback": "Regular"}\n```'
            });
            (service as any).client = {
                models: {
                    generateContent: mockGenerateContent
                }
            };

            const result = await service.validateAnswer('q', 'a');
            expect(result).toEqual({
                rating: 'partial',
                feedback: 'Regular'
            });
        });

        it('deberia retornar fallback si la respuesta de la API no tiene texto', async () => {

            const mockGenerateContent = jest.fn<any>().mockResolvedValue({});
            (service as any).client = {
                models: {
                    generateContent: mockGenerateContent
                }
            };

            const result = await service.validateAnswer('q', 'a');
            expect(result).toEqual({
                rating: 'partial',
                feedback: 'No se pudo validar la respuesta automáticamente.'
            });
        });

        it('deberia retornar fallback si el JSON es invalido', async () => {

            const mockGenerateContent = jest.fn<any>().mockResolvedValue({
                text: 'invalid json'
            });
            (service as any).client = {
                models: {
                    generateContent: mockGenerateContent
                }
            };

            const result = await service.validateAnswer('q', 'a');
            expect(result).toEqual({
                rating: 'partial',
                feedback: 'No se pudo validar la respuesta automáticamente.'
            });
        });

        it('deberia retornar fallback si la API falla', async () => {

            const mockGenerateContent = jest.fn<any>().mockRejectedValue(new Error('API failure'));
            (service as any).client = {
                models: {
                    generateContent: mockGenerateContent
                }
            };

            const result = await service.validateAnswer('q', 'a');
            expect(result).toEqual({
                rating: 'partial',
                feedback: 'No se pudo validar la respuesta automáticamente.'
            });
        });
    });
});
