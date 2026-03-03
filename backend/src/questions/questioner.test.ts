import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Questioner, QuestionerForProfessor, QuestionerForStudent } from './questioner';
import { DatabaseService } from '../database/database.service';

describe('Questioner', () => {
    const mockQuestions: any[] = [
        { _id: 'q1', text: 'question 1', topic: 'html' },
        { _id: 'q2', text: 'question 2', topic: 'css' }
    ];

    describe('create', () => {
        const mockDb = {} as DatabaseService;

        it('deberia crear QuestionerForProfessor cuando el rol es PROFESSOR', () => {
            const questioner = Questioner.create('PROFESSOR', mockDb, 'user-1', mockQuestions[0]);
            expect(questioner).toBeInstanceOf(QuestionerForProfessor);
        });

        it('deberia crear QuestionerForStudent cuando el rol es STUDENT', () => {
            const questioner = Questioner.create('STUDENT', mockDb, 'user-1', mockQuestions[0]);
            expect(questioner).toBeInstanceOf(QuestionerForStudent);
        });

        it('deberia crear QuestionerForStudent cuando el rol es undefined', () => {
            const questioner = Questioner.create(undefined, mockDb, 'user-1', mockQuestions[0]);
            expect(questioner).toBeInstanceOf(QuestionerForStudent);
        });
    });

    describe('QuestionerForProfessor', () => {
        let mockDb: any;

        beforeEach(() => {
            mockDb = {
                getAnswerForQuestionToday: jest.fn(),
                getAllQuestions: jest.fn<any>().mockResolvedValue(mockQuestions),
                getAllTopics: jest.fn<any>().mockResolvedValue([
                    { name: 'html', enabled: true },
                    { name: 'css', enabled: true }
                ]),
                assignQuestionToUser: jest.fn(),
            };
        });

        it('deberia retornar la pregunta actual si el profesor aun no respondio', async () => {
            mockDb.getAnswerForQuestionToday.mockResolvedValue(null);

            const questioner = new QuestionerForProfessor(mockDb, 'user-1', mockQuestions[0]);
            const result = await questioner.getRandomQuestion();

            expect(result.question).toEqual(mockQuestions[0]);
            expect(result.hasAnswered).toBe(false);
            expect(result.answerId).toBeUndefined();
        });

        it('deberia retornar una pregunta diferente si el profesor ya respondio', async () => {
            mockDb.getAnswerForQuestionToday.mockResolvedValue({ _id: 'a1', rating: 'correct' });

            const questioner = new QuestionerForProfessor(mockDb, 'user-1', mockQuestions[0]);
            const result = await questioner.getRandomQuestion();

            expect((result.question as any)._id).toBe('q2');
            expect(result.hasAnswered).toBe(false);
            expect(mockDb.assignQuestionToUser).toHaveBeenCalledWith('user-1', 'q2');
        });

        it('deberia filtrar por topicos activos cuando el profesor ya respondio', async () => {
            mockDb.getAnswerForQuestionToday.mockResolvedValue({ _id: 'a1', rating: 'correct' });
            mockDb.getAllTopics.mockResolvedValue([
                { name: 'html', enabled: false },
                { name: 'css', enabled: true }
            ]);

            const questioner = new QuestionerForProfessor(mockDb, 'user-1', mockQuestions[0]);
            const result = await questioner.getRandomQuestion();

            expect(result.question.topic).toBe('css');
            expect(mockDb.assignQuestionToUser).toHaveBeenCalledWith('user-1', 'q2');
        });
    });

    describe('QuestionerForStudent', () => {
        let mockDb: any;

        beforeEach(() => {
            mockDb = {
                getAnswerForQuestionToday: jest.fn(),
            };
        });

        it('deberia retornar hasAnswered false si el estudiante no respondio', async () => {
            mockDb.getAnswerForQuestionToday.mockResolvedValue(null);

            const questioner = new QuestionerForStudent(mockDb, 'user-1', mockQuestions[0]);
            const result = await questioner.getRandomQuestion();

            expect(result.question).toEqual(mockQuestions[0]);
            expect(result.hasAnswered).toBe(false);
            expect(result.answerId).toBeUndefined();
        });

        it('deberia retornar hasAnswered true con datos de respuesta si el estudiante ya respondio', async () => {
            mockDb.getAnswerForQuestionToday.mockResolvedValue({ _id: 'a1', rating: 'incorrect' });

            const questioner = new QuestionerForStudent(mockDb, 'user-1', mockQuestions[0]);
            const result = await questioner.getRandomQuestion();

            expect(result.question).toEqual(mockQuestions[0]);
            expect(result.hasAnswered).toBe(true);
            expect(result.answerId).toBe('a1');
            expect(result.rating).toBe('incorrect');
        });
    });
});
