import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AnswerService } from './answer.service';
import { Model, Types } from 'mongoose';
import { Answer, AnswerDocument } from '../../database/schemas/answer.schema';

describe('AnswerService', () => {
    let service: AnswerService;
    let mockAnswerModel: any;
    let mockQuery: any;

    beforeEach(() => {
        mockQuery = {
            exec: jest.fn(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
        };

        const mockModelFn = jest.fn().mockImplementation((data: Partial<AnswerDocument>) => {
            const mockInstance: any = { ...data };
            const mockSave: any = jest.fn();
            mockSave.mockResolvedValue({ ...data, _id: 'a1' });
            mockInstance.save = mockSave;
            return mockInstance;
        });
        
        (mockModelFn as any).find = jest.fn().mockReturnValue(mockQuery);
        (mockModelFn as any).findOne = jest.fn().mockReturnValue(mockQuery);

        mockAnswerModel = mockModelFn;

        service = new AnswerService(mockAnswerModel);
    });

    describe('createAnswer', () => {
        it('deberia crear una respuesta correctamente', async () => {
            const answerData = { userId: 'u1', questionId: 'q1', rating: 'correct' };
            const savedAnswer: any = { ...answerData, _id: 'a1' };
            const mockSaveFn: any = jest.fn();
            mockSaveFn.mockResolvedValue(savedAnswer);
            (mockAnswerModel as any).mockImplementationOnce(() => ({
                save: mockSaveFn,
            }));

            const result = await service.createAnswer(answerData);

            expect(result).toEqual(expect.objectContaining(savedAnswer));
        });
    });

    describe('getAnswersByUserId', () => {
        it('deberia retornar respuestas de un usuario ordenadas por fecha', async () => {
            const answers: any = [
                { userId: 'u1', timestamp: new Date('2024-01-02') },
                { userId: 'u1', timestamp: new Date('2024-01-01') },
            ];
            mockQuery.exec.mockResolvedValue(answers);

            const result = await service.getAnswersByUserId('u1', 50);

            expect(result).toEqual(answers);
        });

        it('deberia usar limite de 50 por defecto', async () => {
            const chainMock = {
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                // @ts-ignore - Mock for testing
                exec: jest.fn().mockResolvedValue([] as any),
            };
            (mockAnswerModel.find as any).mockReturnValue(chainMock);

            await service.getAnswersByUserId('u1');

            expect(chainMock.limit).toHaveBeenCalledWith(50);
        });
    });

    describe('getAnswerForQuestionToday', () => {
        it('deberia retornar null si no hay respuesta hoy', async () => {
            mockQuery.exec.mockResolvedValue(null);

            const result = await service.getAnswerForQuestionToday('u1', 'q1');

            expect(result).toBeNull();
        });

        it('deberia retornar la respuesta si existe hoy', async () => {
            const answer: any = { userId: 'u1', questionId: 'q1', timestamp: new Date() };
            mockQuery.exec.mockResolvedValue(answer);

            const result = await service.getAnswerForQuestionToday('u1', 'q1');

            expect(result).toEqual(answer);
        });
    });
});
