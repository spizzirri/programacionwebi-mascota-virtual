import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { QuestionService } from './question.service';
import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from '../../database/schemas/question.schema';
import { Topic, TopicDocument } from '../../database/schemas/topic.schema';

describe('QuestionService', () => {
    let service: QuestionService;
    let mockQuestionModel: any;
    let mockTopicModel: any;
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

        const mockQuestionModelFn = jest.fn().mockImplementation((data: Partial<QuestionDocument>) => {
            const mockInstance: any = { ...data };
            const mockSave: any = jest.fn();
            mockSave.mockResolvedValue({ ...data, _id: 'q1' });
            mockInstance.save = mockSave;
            return mockInstance;
        });
        
        (mockQuestionModelFn as any).save = jest.fn();
        (mockQuestionModelFn as any).findById = jest.fn().mockReturnValue(mockQuery);
        (mockQuestionModelFn as any).find = jest.fn().mockReturnValue(mockQuery);
        (mockQuestionModelFn as any).findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
        (mockQuestionModelFn as any).findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);
        (mockQuestionModelFn as any).insertMany = jest.fn();
        (mockQuestionModelFn as any).countDocuments = jest.fn().mockReturnValue(mockQuery);
        (mockQuestionModelFn as any).deleteMany = jest.fn().mockReturnValue(mockQuery);

        mockQuestionModel = mockQuestionModelFn;

        mockTopicModel = {
            findOneAndUpdate: jest.fn().mockReturnValue(mockQuery),
            find: jest.fn().mockReturnValue(mockQuery),
            findOne: jest.fn().mockReturnValue(mockQuery),
            sort: jest.fn().mockReturnThis(),
        };

        service = new QuestionService(mockQuestionModel, mockTopicModel);
    });

    describe('createQuestion', () => {
        it('deberia crear una pregunta correctamente', async () => {
            const questionData = { text: 'Test question', topic: 'html' };
            const savedQuestion: any = { ...questionData, _id: 'q1' };
            
            const mockSaveFn: any = jest.fn();
            mockSaveFn.mockResolvedValue(savedQuestion);
            (mockQuestionModel as any).mockImplementationOnce(() => ({
                save: mockSaveFn,
            }));
            mockQuery.exec.mockResolvedValue({ name: 'html' });

            const result = await service.createQuestion(questionData);

            expect(result).toEqual(expect.objectContaining(savedQuestion));
        });
    });

    describe('createQuestions', () => {
        it('deberia crear multiples preguntas', async () => {
            const questions = [
                { text: 'Q1', topic: 'html' },
                { text: 'Q2', topic: 'css' },
            ];
            (mockQuestionModel.insertMany as any).mockResolvedValue(questions);
            mockQuery.exec.mockResolvedValue({ name: 'html' });

            const result = await service.createQuestions(questions);

            expect(result).toEqual(questions);
        });
    });

    describe('getAllQuestions', () => {
        it('deberia retornar todas las preguntas', async () => {
            const questions = [{ text: 'Q1' }, { text: 'Q2' }];
            mockQuery.exec.mockResolvedValue(questions);

            const result = await service.getAllQuestions();

            expect(result).toEqual(questions);
        });
    });

    describe('getAllQuestionsPaginated', () => {
        it('deberia retornar preguntas paginadas con total', async () => {
            const questions = [{ text: 'Q1' }];
            mockQuery.exec.mockResolvedValueOnce(questions).mockResolvedValueOnce(10);

            const result = await service.getAllQuestionsPaginated(1, 10);

            expect(result.data).toEqual(questions);
            expect(result.total).toBe(10);
        });
    });

    describe('getQuestionById', () => {
        it('deberia retornar una pregunta por id', async () => {
            const question = { _id: 'q1', text: 'Test question' };
            mockQuery.exec.mockResolvedValue(question);

            const result = await service.getQuestionById('q1');

            expect(result).toEqual(question);
        });

        it('deberia lanzar NotFoundException si no encuentra la pregunta', async () => {
            mockQuery.exec.mockResolvedValue(null);

            await expect(service.getQuestionById('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateQuestion', () => {
        it('deberia actualizar una pregunta', async () => {
            const updatedQuestion = { _id: 'q1', text: 'Updated question' };
            mockQuery.exec.mockResolvedValueOnce(updatedQuestion);
            mockQuery.exec.mockResolvedValueOnce({ name: 'html' });

            const result = await service.updateQuestion('q1', { text: 'Updated question' });

            expect(result).toEqual(updatedQuestion);
        });
    });

    describe('deleteQuestion', () => {
        it('deberia eliminar una pregunta', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.deleteQuestion('q1');

            expect(mockQuestionModel.findByIdAndDelete).toHaveBeenCalledWith('q1');
        });
    });

    describe('deleteAllQuestions', () => {
        it('deberia eliminar todas las preguntas', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.deleteAllQuestions();

            expect(mockQuestionModel.deleteMany).toHaveBeenCalledWith({});
        });
    });

    describe('upsertTopic', () => {
        it('deberia crear o actualizar un topico', async () => {
            const topic = { name: 'html', enabled: true };
            mockQuery.exec.mockResolvedValue(topic);

            const result = await service.upsertTopic('html');

            expect(result).toEqual(topic);
        });
    });

    describe('getAllTopics', () => {
        it('deberia retornar todos los topicos ordenados', async () => {
            const topics = [{ name: 'css' }, { name: 'html' }];
            mockQuery.exec.mockResolvedValue(topics);

            const result = await service.getAllTopics();

            expect(result).toEqual(topics);
            expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
        });
    });

    describe('getTopicByName', () => {
        it('deberia retornar un topico por nombre', async () => {
            const topic = { name: 'html', enabled: true };
            mockQuery.exec.mockResolvedValue(topic);

            const result = await service.getTopicByName('html');

            expect(result).toEqual(topic);
        });
    });

    describe('updateTopic', () => {
        it('deberia actualizar un topico', async () => {
            const updatedTopic = { name: 'html', enabled: false };
            mockQuery.exec.mockResolvedValue(updatedTopic);

            const result = await service.updateTopic('html', { enabled: false });

            expect(result).toEqual(updatedTopic);
        });
    });
});
