import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { Problem } from '../../database/schemas/problem.schema';

describe('ProblemService', () => {
    let service: ProblemService;
    let mockProblemModel: any;
    let mockQuery: any;

    const buildProblem = (overrides: Partial<Problem> = {}): Problem => ({
        title: 'T',
        description: 'D',
        params: ['a'],
        testCases: [{ input: [1], expected: 1, sample: true }],
        active: true,
        ...overrides,
    } as Problem);

    beforeEach(() => {
        mockQuery = {
            exec: jest.fn(),
            lean: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
        };

        const mockModelFn: any = jest.fn().mockImplementation((data: Partial<Problem>) => {
            const instance: any = { ...data };
            const mockSave: any = jest.fn();
            mockSave.mockResolvedValue({ ...data, _id: 'p1' });
            instance.save = mockSave;
            return instance;
        });

        mockModelFn.findById = jest.fn().mockReturnValue(mockQuery);
        mockModelFn.find = jest.fn().mockReturnValue(mockQuery);
        mockModelFn.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
        mockModelFn.findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);
        mockModelFn.countDocuments = jest.fn().mockReturnValue(mockQuery);
        mockModelFn.countDocuments.mockReturnValueOnce(Promise.resolve(0));

        mockProblemModel = mockModelFn;

        service = new ProblemService(mockProblemModel);
    });

    describe('getActiveProblems', () => {
        it('deberia retornar solo problemas activos cuando getActiveProblems', async () => {
            const activeProblems = [buildProblem({ title: 'A' }), buildProblem({ title: 'B' })];
            mockQuery.exec.mockResolvedValue(activeProblems);

            const result = await service.getActiveProblems();

            expect(result).toEqual(activeProblems);
            expect(mockProblemModel.find).toHaveBeenCalledWith({ active: true });
        });

        it('deberia retornar un array vacio cuando no hay problemas activos', async () => {
            mockQuery.exec.mockResolvedValue([]);

            const result = await service.getActiveProblems();

            expect(result).toEqual([]);
        });
    });

    describe('getAllProblemsForAdmin', () => {
        it('deberia retornar todos los problemas (incluye inactivos) cuando getAllProblemsForAdmin', async () => {
            const problems = [buildProblem({ title: 'A', active: true }), buildProblem({ title: 'B', active: false } as any)];
            mockQuery.exec.mockResolvedValue(problems);
            mockQuery.sort = jest.fn().mockReturnValue(mockQuery);

            const result = await service.getAllProblemsForAdmin();

            expect(result).toEqual(problems);
            expect(mockProblemModel.find).toHaveBeenCalledWith({});
        });
    });

    describe('getProblemById', () => {
        it('deberia retornar un problema por id cuando getProblemById', async () => {
            const problem = buildProblem({ title: 'A' } as any);
            problem._id = 'p1';
            mockQuery.exec.mockResolvedValue(problem);

            const result = await service.getProblemById('p1');

            expect(result).toEqual(problem);
            expect(mockProblemModel.findById).toHaveBeenCalledWith('p1');
        });

        it('deberia lanzar NotFoundException cuando getProblemById no encuentra el problema', async () => {
            mockQuery.exec.mockResolvedValue(null);

            await expect(service.getProblemById('invalid')).rejects.toThrow(NotFoundException);
        });
    });

    describe('createProblem', () => {
        it('deberia crear un problema cuando createProblem', async () => {
            const data = buildProblem({ title: 'Nuevo', params: ['x'], testCases: [{ input: [1], expected: 1, sample: true }] } as any);
            const saved = { ...data, _id: 'p1' } as any;
            const saveFn: any = jest.fn();
            saveFn.mockResolvedValue(saved);
            mockProblemModel.mockImplementationOnce(() => ({ save: saveFn, ...data }));

            const result = await service.createProblem(data);

            expect(result).toEqual(saved);
            expect(saveFn).toHaveBeenCalled();
        });
    });

    describe('updateProblem', () => {
        it('deberia actualizar un problema cuando updateProblem', async () => {
            const updated = { ...buildProblem(), _id: 'p1', title: 'Updated' } as any;
            mockQuery.exec.mockResolvedValue(updated);

            const result = await service.updateProblem('p1', { title: 'Updated' });

            expect(result).toEqual(updated);
            expect(mockProblemModel.findByIdAndUpdate).toHaveBeenCalledWith('p1', { title: 'Updated' }, { new: true });
        });

        it('deberia retornar null cuando updateProblem no encuentra el problema', async () => {
            mockQuery.exec.mockResolvedValue(null);

            const result = await service.updateProblem('invalid', { title: 'X' });

            expect(result).toBeNull();
        });
    });

    describe('deleteProblem', () => {
        it('deberia eliminar un problema cuando deleteProblem', async () => {
            mockQuery.exec.mockResolvedValue({ _id: 'p1' });

            await service.deleteProblem('p1');

            expect(mockProblemModel.findByIdAndDelete).toHaveBeenCalledWith('p1');
        });
    });

    describe('countProblems', () => {
        it('deberia retornar la cantidad de problemas cuando countProblems', async () => {
            const execFn: any = jest.fn();
            execFn.mockResolvedValue(3);
            mockProblemModel.countDocuments = jest.fn().mockReturnValue({ exec: execFn });
            const result = await service.countProblems();
            expect(result).toBe(3);
        });
    });
});