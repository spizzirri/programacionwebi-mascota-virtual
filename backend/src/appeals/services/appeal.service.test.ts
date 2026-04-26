import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AppealService } from './appeal.service';
import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Appeal, AppealDocument } from '../../database/schemas/appeal.schema';

describe('AppealService', () => {
    let service: AppealService;
    let mockAppealModel: any;
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

        const mockModelFn = jest.fn().mockImplementation((data: Partial<AppealDocument>) => {
            const mockInstance: any = { ...data };
            const mockSave: any = jest.fn();
            mockSave.mockResolvedValue({ ...data, _id: 'ap1' });
            mockInstance.save = mockSave;
            return mockInstance;
        });
        
        (mockModelFn as any).save = jest.fn();
        (mockModelFn as any).find = jest.fn().mockReturnValue(mockQuery);
        (mockModelFn as any).findById = jest.fn().mockReturnValue(mockQuery);
        (mockModelFn as any).findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
        (mockModelFn as any).countDocuments = jest.fn().mockReturnValue(mockQuery);

        mockAppealModel = mockModelFn;

        service = new AppealService(mockAppealModel);
    });

    describe('createAppeal', () => {
        it('deberia crear una apelacion correctamente', async () => {
            const appealData = { userId: 'u1', answerId: 'a1', status: 'pending' };
            const savedAppeal = { ...appealData, _id: 'ap1' };
            
            (mockAppealModel as any).mockImplementationOnce(() => ({
                // @ts-ignore - Mock for testing
                save: jest.fn().mockResolvedValue(savedAppeal as any),
            }));

            const result = await service.createAppeal(appealData);

            expect(result).toEqual(expect.objectContaining(savedAppeal));
        });
    });

    describe('getAppealsByUserId', () => {
        it('deberia retornar apelaciones de un usuario ordenadas por fecha', async () => {
            const appeals = [
                { userId: 'u1', createdAt: new Date('2024-01-02') },
                { userId: 'u1', createdAt: new Date('2024-01-01') },
            ];
            mockQuery.exec.mockResolvedValue(appeals);

            const result = await service.getAppealsByUserId('u1');

            expect(result).toEqual(appeals);
            expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
        });
    });

    describe('getAllAppeals', () => {
        it('deberia retornar todas las apelaciones', async () => {
            const appeals = [{ status: 'pending' }, { status: 'accepted' }];
            mockQuery.exec.mockResolvedValue(appeals);

            const result = await service.getAllAppeals();

            expect(result).toEqual(appeals);
        });
    });

    describe('getAllAppealsPaginated', () => {
        it('deberia retornar apelaciones paginadas con total', async () => {
            const appeals = [{ status: 'pending' }];
            mockQuery.exec.mockResolvedValueOnce(appeals).mockResolvedValueOnce(10);

            const result = await service.getAllAppealsPaginated(1, 10);

            expect(result.data).toEqual(appeals);
            expect(result.total).toBe(10);
        });
    });

    describe('getAppealById', () => {
        it('deberia retornar una apelacion por id', async () => {
            const appeal = { _id: 'ap1', status: 'pending' };
            mockQuery.exec.mockResolvedValue(appeal);

            const result = await service.getAppealById('ap1');

            expect(result).toEqual(appeal);
        });
    });

    describe('updateAppeal', () => {
        it('deberia actualizar una apelacion', async () => {
            const updatedAppeal = { _id: 'ap1', status: 'accepted' };
            mockQuery.exec.mockResolvedValue(updatedAppeal);

            const result = await service.updateAppeal('ap1', { status: 'accepted' });

            expect(result).toEqual(updatedAppeal);
        });
    });
});
