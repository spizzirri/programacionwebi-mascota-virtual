import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SandboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';
import { ProblemService } from './services/problem.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { ProfessorGuard } from '../common/guards/professor.guard';

describe('SandboxController', () => {
    let controller: SandboxController;
    let sandboxService: jest.Mocked<SandboxService>;
    let problemService: jest.Mocked<ProblemService>;

    beforeEach(async () => {
        sandboxService = {
            getProblems: jest.fn(),
            runCode: jest.fn(),
        } as unknown as jest.Mocked<SandboxService>;

        problemService = {
            getProblemById: jest.fn(),
            createProblem: jest.fn(),
            updateProblem: jest.fn(),
            deleteProblem: jest.fn(),
            getAllProblemsForAdmin: jest.fn(),
        } as unknown as jest.Mocked<ProblemService>;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SandboxController],
            providers: [
                { provide: SandboxService, useValue: sandboxService },
                { provide: ProblemService, useValue: problemService },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .overrideGuard(ProfessorGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<SandboxController>(SandboxController);
    });

    describe('GET /sandbox/problems', () => {
        it('deberia retornar sanitized problems quando se llama getProblems', async () => {
            const sanitized = [{ _id: 'p1', title: 'T', testCases: [] }];
            sandboxService.getProblems.mockResolvedValue(sanitized as any);

            const result = await controller.getProblems();

            expect(result).toEqual(sanitized);
            expect(sandboxService.getProblems).toHaveBeenCalled();
        });
    });

    describe('GET /sandbox/problems/:id', () => {
        it('deberia retornar el detalle de un problema cuando getProblem', async () => {
            const problem = { _id: 'p1', title: 'T', description: 'D', testCases: [] };
            problemService.getProblemById.mockResolvedValue(problem as any);

            const result = await controller.getProblem('p1');

            expect(result).toEqual({ problem });
            expect(problemService.getProblemById).toHaveBeenCalledWith('p1');
        });
    });

    describe('POST /sandbox/run', () => {
        it('deberia ejecutar codigo y retornar RunResponse quando runCode', async () => {
            const response = { results: [], allPassed: true, error: null };
            sandboxService.runCode.mockResolvedValue(response as any);

            const result = await controller.runCode({ problemId: 'p1', code: 'x' });

            expect(result).toEqual(response);
            expect(sandboxService.runCode).toHaveBeenCalledWith('p1', 'x');
        });
    });

    describe('POST /sandbox/problems (admin)', () => {
        it('deberia criar problema y retornar resposta quando createProblem', async () => {
            const body = {
                title: 'T',
                description: 'D',
                params: ['x'],
                testCases: [{ input: [1], expected: 1, sample: true }],
            };
            const created = { _id: 'p1', ...body };
            problemService.createProblem.mockResolvedValue(created as any);

            const result = await controller.createProblem(body as any);

            expect(result).toEqual({ problem: created });
            expect(problemService.createProblem).toHaveBeenCalledWith(body);
        });
    });

    describe('PATCH /sandbox/problems/:id (admin)', () => {
        it('deberia atualizar problema y retornar resposta quando updateProblem', async () => {
            const updated = { _id: 'p1', title: 'Updated' };
            problemService.updateProblem.mockResolvedValue(updated as any);

            const result = await controller.updateProblem('p1', { title: 'Updated' } as any);

            expect(result).toEqual({ problem: updated });
            expect(problemService.updateProblem).toHaveBeenCalledWith('p1', { title: 'Updated' });
        });

        it('deberia retornar 404 (problema no encontrado) quando updateProblem retorna null', async () => {
            problemService.updateProblem.mockResolvedValue(null as any);

            await expect(controller.updateProblem('p1', {} as any)).rejects.toThrow('Problem not found');
        });
    });

    describe('DELETE /sandbox/problems/:id (admin)', () => {
        it('deberia eliminar problema y retornar sucesso quando deleteProblem', async () => {
            problemService.deleteProblem.mockResolvedValue(undefined);

            const result = await controller.deleteProblem('p1');

            expect(result).toEqual({ success: true });
            expect(problemService.deleteProblem).toHaveBeenCalledWith('p1');
        });
    });

    describe('GET /sandbox/problems/admin (admin)', () => {
        it('deberia retornar lista completa admin quando getAllForAdmin', async () => {
            const all = [{ _id: 'p1', title: 'A' }, { _id: 'p2', title: 'B', active: false }];
            problemService.getAllProblemsForAdmin.mockResolvedValue(all as any);

            const result = await controller.getAllForAdmin();

            expect(result).toEqual({ problems: all });
            expect(problemService.getAllProblemsForAdmin).toHaveBeenCalled();
        });
    });
});