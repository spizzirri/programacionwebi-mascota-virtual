import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AnswerService } from './answer.service';

describe('AnswerService', () => {
    let service: AnswerService;
    let mockAnswerModel: any;

    beforeEach(() => {
        mockAnswerModel = jest.fn().mockImplementation((data: any) => {
            const mockInstance: any = Object.assign({}, data);
            (mockInstance.save as any) = jest.fn<any>().mockResolvedValue(Object.assign({}, data, { _id: 'a1' }));
            return mockInstance;
        });
        (mockAnswerModel as any).save = jest.fn();
        (mockAnswerModel as any).find = jest.fn().mockReturnThis();
        (mockAnswerModel as any).findOne = jest.fn().mockReturnThis();
        (mockAnswerModel as any).sort = jest.fn().mockReturnThis();
        (mockAnswerModel as any).limit = jest.fn().mockReturnThis();
        (mockAnswerModel as any).exec = jest.fn();

        service = new AnswerService(mockAnswerModel);
    });

    describe('createAnswer', () => {
        it('deberia crear una respuesta correctamente', async () => {
            const answerData = { userId: 'u1', questionId: 'q1', rating: 'correct' };
            const savedAnswer = { ...answerData, _id: 'a1' };
            mockAnswerModel.save.mockResolvedValue(savedAnswer);

            const result = await service.createAnswer(answerData);

            expect(result).toEqual(savedAnswer);
        });
    });

    describe('getAnswersByUserId', () => {
        it('deberia retornar respuestas de un usuario ordenadas por fecha', async () => {
            const answers = [
                { userId: 'u1', timestamp: new Date('2024-01-02') },
                { userId: 'u1', timestamp: new Date('2024-01-01') },
            ];
            mockAnswerModel.exec.mockResolvedValue(answers);

            const result = await service.getAnswersByUserId('u1', 50);

            expect(result).toEqual(answers);
            expect(mockAnswerModel.sort).toHaveBeenCalledWith({ timestamp: -1 });
        });

        it('deberia usar limite de 50 por defecto', async () => {
            mockAnswerModel.exec.mockResolvedValue([]);

            await service.getAnswersByUserId('u1');

            expect(mockAnswerModel.limit).toHaveBeenCalledWith(50);
        });
    });

    describe('getAnswerForQuestionToday', () => {
        it('deberia retornar null si no hay respuesta hoy', async () => {
            mockAnswerModel.exec.mockResolvedValue(null);

            const result = await service.getAnswerForQuestionToday('u1', 'q1');

            expect(result).toBeNull();
        });

        it('deberia retornar la respuesta si existe hoy', async () => {
            const answer = { userId: 'u1', questionId: 'q1', timestamp: new Date() };
            mockAnswerModel.exec.mockResolvedValue(answer);

            const result = await service.getAnswerForQuestionToday('u1', 'q1');

            expect(result).toEqual(answer);
        });
    });
});
