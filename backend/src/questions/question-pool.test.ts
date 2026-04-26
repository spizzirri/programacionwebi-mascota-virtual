import { describe, it, expect } from '@jest/globals';
import { QuestionPool } from './question-pool';
import { QuestionDocument } from '../database/schemas/question.schema';

describe('QuestionPool', () => {
    const mockQuestions: QuestionDocument[] = [
        { _id: 'q1', text: 'question 1', topic: 'html' } as QuestionDocument,
        { _id: 'q2', text: 'question 2', topic: 'css' } as QuestionDocument,
        { _id: 'q3', text: 'question 3', topic: 'javascript' } as QuestionDocument
    ];

    describe('isEmpty', () => {
        it('deberia retornar true cuando el pool esta vacio', () => {
            const pool = new QuestionPool([]);
            expect(pool.isEmpty()).toBe(true);
        });

        it('deberia retornar false cuando el pool tiene preguntas', () => {
            const pool = new QuestionPool(mockQuestions);
            expect(pool.isEmpty()).toBe(false);
        });
    });

    describe('size', () => {
        it('deberia retornar la cantidad de preguntas', () => {
            const pool = new QuestionPool(mockQuestions);
            expect(pool.size).toBe(3);
        });

        it('deberia retornar 0 cuando el pool esta vacio', () => {
            const pool = new QuestionPool([]);
            expect(pool.size).toBe(0);
        });
    });

    describe('pickRandom', () => {
        it('deberia retornar una pregunta del pool', () => {
            const pool = new QuestionPool(mockQuestions);
            const question = pool.pickRandom();
            expect(mockQuestions).toContain(question);
        });

        it('deberia retornar la unica pregunta si el pool tiene una sola', () => {
            const pool = new QuestionPool([mockQuestions[0]]);
            const question = pool.pickRandom();
            expect(question).toEqual(mockQuestions[0]);
        });
    });

    describe('pickDifferentFrom', () => {
        it('deberia retornar una pregunta diferente cuando hay mas de una disponible', () => {
            const pool = new QuestionPool(mockQuestions);
            const current = mockQuestions[0];
            const result = pool.pickDifferentFrom(current);
            expect((result as any)._id).not.toBe('q1');
        });

        it('deberia retornar la misma pregunta cuando es la unica disponible', () => {
            const pool = new QuestionPool([mockQuestions[0]]);
            const result = pool.pickDifferentFrom(mockQuestions[0]);
            expect((result as any)._id).toBe('q1');
        });
    });

    describe('filterByTopics', () => {
        it('deberia filtrar preguntas por topicos activos', () => {
            const pool = new QuestionPool(mockQuestions);
            const filtered = pool.filterByTopics(['html', 'css']);
            expect(filtered.size).toBe(2);
        });

        it('deberia retornar pool vacio si ningun topico coincide', () => {
            const pool = new QuestionPool(mockQuestions);
            const filtered = pool.filterByTopics(['python']);
            expect(filtered.isEmpty()).toBe(true);
        });

        it('deberia retornar todas las preguntas si todos los topicos coinciden', () => {
            const pool = new QuestionPool(mockQuestions);
            const filtered = pool.filterByTopics(['html', 'css', 'javascript']);
            expect(filtered.size).toBe(3);
        });
    });
});
