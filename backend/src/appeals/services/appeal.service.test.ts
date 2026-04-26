import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AppealService } from './appeal.service';
import { NotFoundException } from '@nestjs/common';

describe('AppealService', () => {
    let service: AppealService;
    let mockAppealModel: any;

    beforeEach(() => {
        mockAppealModel = jest.fn().mockImplementation((data: any) => {
            const mockInstance: any = Object.assign({}, data);
            (mockInstance.save as any) = jest.fn<any>().mockResolvedValue(Object.assign({}, data, { _id: 'ap1' }));
            return mockInstance;
        });
        (mockAppealModel as any).save = jest.fn();
        (mockAppealModel as any).find = jest.fn().mockReturnThis();
        (mockAppealModel as any).findById = jest.fn().mockReturnThis();
        (mockAppealModel as any).findByIdAndUpdate = jest.fn().mockReturnThis();
        (mockAppealModel as any).countDocuments = jest.fn().mockReturnThis();
        (mockAppealModel as any).sort = jest.fn().mockReturnThis();
        (mockAppealModel as any).skip = jest.fn().mockReturnThis();
        (mockAppealModel as any).limit = jest.fn().mockReturnThis();
        (mockAppealModel as any).exec = jest.fn();

        service = new AppealService(mockAppealModel);
    });

    describe('createAppeal', () => {
        it('deberia crear una apelacion correctamente', async () => {
            const appealData = { userId: 'u1', answerId: 'a1', status: 'pending' };
            const savedAppeal = { ...appealData, _id: 'ap1' };
            mockAppealModel.save.mockResolvedValue(savedAppeal);

            const result = await service.createAppeal(appealData);

            expect(result).toEqual(savedAppeal);
        });
    });

    describe('getAppealsByUserId', () => {
        it('deberia retornar apelaciones de un usuario ordenadas por fecha', async () => {
            const appeals = [
                { userId: 'u1', createdAt: new Date('2024-01-02') },
                { userId: 'u1', createdAt: new Date('2024-01-01') },
            ];
            mockAppealModel.exec.mockResolvedValue(appeals);

            const result = await service.getAppealsByUserId('u1');

            expect(result).toEqual(appeals);
            expect(mockAppealModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
        });
    });

    describe('getAllAppeals', () => {
        it('deberia retornar todas las apelaciones', async () => {
            const appeals = [{ status: 'pending' }, { status: 'accepted' }];
            mockAppealModel.exec.mockResolvedValue(appeals);

            const result = await service.getAllAppeals();

            expect(result).toEqual(appeals);
        });
    });

    describe('getAllAppealsPaginated', () => {
        it('deberia retornar apelaciones paginadas con total', async () => {
            const appeals = [{ status: 'pending' }];
            mockAppealModel.exec.mockResolvedValueOnce(appeals).mockResolvedValueOnce(10);

            const result = await service.getAllAppealsPaginated(1, 10);

            expect(result.data).toEqual(appeals);
            expect(result.total).toBe(10);
        });
    });

    describe('getAppealById', () => {
        it('deberia retornar una apelacion por id', async () => {
            const appeal = { _id: 'ap1', status: 'pending' };
            mockAppealModel.exec.mockResolvedValue(appeal);

            const result = await service.getAppealById('ap1');

            expect(result).toEqual(appeal);
        });
    });

    describe('updateAppeal', () => {
        it('deberia actualizar una apelacion', async () => {
            const updatedAppeal = { _id: 'ap1', status: 'accepted' };
            mockAppealModel.exec.mockResolvedValue(updatedAppeal);

            const result = await service.updateAppeal('ap1', { status: 'accepted' });

            expect(result).toEqual(updatedAppeal);
        });
    });
});
