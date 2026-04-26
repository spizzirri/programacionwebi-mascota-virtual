import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { QuestionService } from './question.service';
import { NotFoundException } from '@nestjs/common';

describe('QuestionService', () => {
    let service: QuestionService;
    let mockQuestionModel: any;
    let mockTopicModel: any;

    beforeEach(() => {
        mockQuestionModel = jest.fn().mockImplementation((data: any) => {
            const mockInstance: any = Object.assign({}, data);
            (mockInstance.save as any) = jest.fn<any>().mockResolvedValue(Object.assign({}, data, { _id: 'q1' }));
            return mockInstance;
        });
        (mockQuestionModel as any).save = jest.fn();
        (mockQuestionModel as any).findById = jest.fn().mockReturnThis();
        (mockQuestionModel as any).find = jest.fn().mockReturnThis();
        (mockQuestionModel as any).findByIdAndUpdate = jest.fn().mockReturnThis();
        (mockQuestionModel as any).findByIdAndDelete = jest.fn().mockReturnThis();
        (mockQuestionModel as any).insertMany = jest.fn();
        (mockQuestionModel as any).countDocuments = jest.fn().mockReturnThis();
        (mockQuestionModel as any).deleteMany = jest.fn().mockReturnThis();
        (mockQuestionModel as any).skip = jest.fn().mockReturnThis();
        (mockQuestionModel as any).limit = jest.fn().mockReturnThis();
        (mockQuestionModel as any).exec = jest.fn();

        mockTopicModel = {
            findOneAndUpdate: jest.fn().mockReturnThis(),
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            exec: jest.fn(),
        };

        service = new QuestionService(mockQuestionModel, mockTopicModel);
    });

    describe('createQuestion', () => {
        it('deberia crear una pregunta correctamente', async () => {
            const questionData = { text: 'Test question', topic: 'html' };
            const savedQuestion = { ...questionData, _id: 'q1' };
            mockQuestionModel.save.mockResolvedValue(savedQuestion);
            mockTopicModel.exec.mockResolvedValue({ name: 'html' });

            const result = await service.createQuestion(questionData);

            expect(result).toEqual(savedQuestion);
        });
    });

    describe('createQuestions', () => {
        it('deberia crear multiples preguntas', async () => {
            const questions = [
                { text: 'Q1', topic: 'html' },
                { text: 'Q2', topic: 'css' },
            ];
            mockQuestionModel.insertMany.mockReturnValue(questions);
            mockTopicModel.exec.mockResolvedValue({ name: 'html' });

            const result = await service.createQuestions(questions);

            expect(result).toEqual(questions);
        });
    });

    describe('getAllQuestions', () => {
        it('deberia retornar todas las preguntas', async () => {
            const questions = [{ text: 'Q1' }, { text: 'Q2' }];
            mockQuestionModel.exec.mockResolvedValue(questions);

            const result = await service.getAllQuestions();

            expect(result).toEqual(questions);
        });
    });

    describe('getAllQuestionsPaginated', () => {
        it('deberia retornar preguntas paginadas con total', async () => {
            const questions = [{ text: 'Q1' }];
            mockQuestionModel.exec.mockResolvedValueOnce(questions).mockResolvedValueOnce(10);

            const result = await service.getAllQuestionsPaginated(1, 10);

            expect(result.data).toEqual(questions);
            expect(result.total).toBe(10);
        });
    });

    describe('getQuestionById', () => {
        it('deberia retornar una pregunta por id', async () => {
            const question = { _id: 'q1', text: 'Test question' };
            mockQuestionModel.exec.mockResolvedValue(question);

            const result = await service.getQuestionById('q1');

            expect(result).toEqual(question);
        });

        it('deberia lanzar NotFoundException si no encuentra la pregunta', async () => {
            mockQuestionModel.exec.mockResolvedValue(null);

            await expect(service.getQuestionById('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateQuestion', () => {
        it('deberia actualizar una pregunta', async () => {
            const updatedQuestion = { _id: 'q1', text: 'Updated question' };
            mockQuestionModel.exec.mockResolvedValue(updatedQuestion);
            mockTopicModel.exec.mockResolvedValue({ name: 'html' });

            const result = await service.updateQuestion('q1', { text: 'Updated question' });

            expect(result).toEqual(updatedQuestion);
        });
    });

    describe('deleteQuestion', () => {
        it('deberia eliminar una pregunta', async () => {
            mockQuestionModel.exec.mockResolvedValue(undefined);

            await service.deleteQuestion('q1');

            expect(mockQuestionModel.findByIdAndDelete).toHaveBeenCalledWith('q1');
        });
    });

    describe('deleteAllQuestions', () => {
        it('deberia eliminar todas las preguntas', async () => {
            mockQuestionModel.exec.mockResolvedValue(undefined);

            await service.deleteAllQuestions();

            expect(mockQuestionModel.deleteMany).toHaveBeenCalledWith({});
        });
    });

    describe('upsertTopic', () => {
        it('deberia crear o actualizar un topico', async () => {
            const topic = { name: 'html', enabled: true };
            mockTopicModel.exec.mockResolvedValue(topic);

            const result = await service.upsertTopic('html');

            expect(result).toEqual(topic);
        });
    });

    describe('getAllTopics', () => {
        it('deberia retornar todos los topicos ordenados', async () => {
            const topics = [{ name: 'css' }, { name: 'html' }];
            mockTopicModel.exec.mockResolvedValue(topics);

            const result = await service.getAllTopics();

            expect(result).toEqual(topics);
            expect(mockTopicModel.sort).toHaveBeenCalledWith({ name: 1 });
        });
    });

    describe('getTopicByName', () => {
        it('deberia retornar un topico por nombre', async () => {
            const topic = { name: 'html', enabled: true };
            mockTopicModel.exec.mockResolvedValue(topic);

            const result = await service.getTopicByName('html');

            expect(result).toEqual(topic);
        });
    });

    describe('updateTopic', () => {
        it('deberia actualizar un topico', async () => {
            const updatedTopic = { name: 'html', enabled: false };
            mockTopicModel.exec.mockResolvedValue(updatedTopic);

            const result = await service.updateTopic('html', { enabled: false });

            expect(result).toEqual(updatedTopic);
        });
    });
});
