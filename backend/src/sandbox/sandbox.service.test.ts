import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SandboxService } from './sandbox.service';
import { ProblemService } from './services/problem.service';
import { Problem } from '../database/schemas/problem.schema';

describe('SandboxService', () => {
    let service: SandboxService;
    let problemService: jest.Mocked<ProblemService>;

    const buildProblem = (overrides: Partial<Problem> = {}): Problem => ({
        title: 'T',
        description: 'D',
        params: ['x', 'y'],
        testCases: [
            { input: [1, 2], expected: 3, sample: true },
            { input: [10, 20], expected: 30, sample: true },
            { input: [0, 0], expected: 0, sample: false },
        ],
        active: true,
        ...overrides,
    } as Problem);

    beforeEach(() => {
        problemService = {
            getActiveProblems: jest.fn(),
            getProblemById: jest.fn(),
            countProblems: jest.fn(),
            createProblem: jest.fn(),
            updateProblem: jest.fn(),
            deleteProblem: jest.fn(),
            getAllProblemsForAdmin: jest.fn(),
        } as unknown as jest.Mocked<ProblemService>;
        service = new SandboxService(problemService);
    });

    describe('seedProblems (OnModuleInit)', () => {
        it('deberia sembrar 2 problemas iniciales cuando onModuleInit y la coleccion esta vacia', async () => {
            problemService.countProblems.mockResolvedValue(0);
            problemService.createProblem.mockResolvedValue({} as any);

            await service.seedProblems();

            expect(problemService.countProblems).toHaveBeenCalled();
            expect(problemService.createProblem).toHaveBeenCalledTimes(2);
        });

        it('deberia no sembrar nada cuando onModuleInit y la coleccion ya tiene problemas', async () => {
            problemService.countProblems.mockResolvedValue(3);

            await service.seedProblems();

            expect(problemService.createProblem).not.toHaveBeenCalled();
        });
    });

    describe('getProblems (sanitize)', () => {
        it('deberia retornar sample testCases completos (input+expected) cuando getProblems', async () => {
            const problems = [buildProblem({ title: 'A' } as any)];
            (problems[0] as any)._id = 'p1';
            problemService.getActiveProblems.mockResolvedValue(problems);

            const result = await service.getProblems();

            const sampleTests = (result[0] as any).testCases.filter((tc: any) => tc.sample);
            expect(sampleTests).toHaveLength(2);
            sampleTests.forEach((tc: any) => {
                expect(tc.input).toBeDefined();
                expect(tc.expected).toBeDefined();
            });
        });

        it('deberia ocultar input/expected de los tests no-sample pero conservar flag sample=false cuando getProblems', async () => {
            const problems = [buildProblem()];
            (problems[0] as any)._id = 'p1';
            problemService.getActiveProblems.mockResolvedValue(problems);

            const result = await service.getProblems();

            const hiddenTests = (result[0] as any).testCases.filter((tc: any) => !tc.sample);
            expect(hiddenTests).toHaveLength(1);
            expect(hiddenTests[0].input).toBe('[oculto]');
            expect(hiddenTests[0].expected).toBe('[oculto]');
            expect(hiddenTests[0].sample).toBe(false);
        });

        it('deberia retornar lista vacia cuando no hay problemas activos', async () => {
            problemService.getActiveProblems.mockResolvedValue([]);
            const result = await service.getProblems();
            expect(result).toEqual([]);
        });
    });

    describe('runCode', () => {
        const validCode = 'function solve(x, y) { return x + y; }';

        it('deberia ejecutar solve contra todos los tests (visibles y ocultos) cuando runCode', async () => {
            const problem = buildProblem();
            (problem as any)._id = 'p1';
            problemService.getProblemById.mockResolvedValue(problem);

            const result = await service.runCode('p1', validCode);

            expect(result.results).toHaveLength(3);
            expect(result.allPassed).toBe(true);
            expect(result.error).toBeNull();
        });

        it('deberia retornar allPassed=false cuando solve falla al menos un test', async () => {
            const problem = buildProblem();
            (problem as any)._id = 'p1';
            problemService.getProblemById.mockResolvedValue(problem);
            const failingCode = 'function solve(x, y) { return x - y; }';

            const result = await service.runCode('p1', failingCode);

            expect(result.allPassed).toBe(false);
            expect(result.results.some((r: any) => !r.passed)).toBe(true);
        });

        it('deberia marcar input y expected como [oculto] en el resultado cuando el test no-sample falla', async () => {
            const problem = buildProblem();
            (problem as any)._id = 'p1';
            problemService.getProblemById.mockResolvedValue(problem);
            const failingCode = 'function solve(x, y) { return -1; }';

            const result = await service.runCode('p1', failingCode);

            const hiddenResult = result.results.find((r: any) => !r.hidden && r.passed === false) ?? result.results[2];
            expect(result.results[2].hidden).toBe(true);
            expect(result.results[2].input).toBe('[oculto]');
            expect(result.results[2].expected).toBe('[oculto]');
        });

        it('deberia mantener input/expected visibles en resultados sample cuando runCode', async () => {
            const problem = buildProblem();
            (problem as any)._id = 'p1';
            problemService.getProblemById.mockResolvedValue(problem);

            const result = await service.runCode('p1', validCode);

            expect(result.results[0].hidden).toBe(false);
            expect(result.results[0].input).toEqual([1, 2]);
            expect(result.results[0].expected).toBe(3);
        });

        it('deberia retornar error "Problem not found" cuando runCode recibe id inexistente', async () => {
            problemService.getProblemById.mockRejectedValue(new Error('Problem not found'));

            const result = await service.runCode('unknown', validCode);

            expect(result.allPassed).toBe(false);
            expect(result.error).toBe('Problem not found');
            expect(result.results).toEqual([]);
        });

        it('deberia retornar error "solve function not defined" cuando el codigo no define solve', async () => {
            const problem = buildProblem();
            (problem as any)._id = 'p1';
            problemService.getProblemById.mockResolvedValue(problem);

            const result = await service.runCode('p1', 'const x = 1;');

            expect(result.allPassed).toBe(false);
            expect(result.error).toBe('solve function not defined');
        });

        it('deberia propagar mensaje de error cuando el codigo lanza excepcion', async () => {
            const problem = buildProblem();
            (problem as any)._id = 'p1';
            problemService.getProblemById.mockResolvedValue(problem);
            const throwingCode = 'function solve(x, y) { throw new Error("boom"); }';

            const result = await service.runCode('p1', throwingCode);

            expect(result.allPassed).toBe(false);
            expect(result.error).toBe('boom');
        });

        it('deberia retornar results con longitud 1 cuando el codigo lanza excepcion en cada test', async () => {
            const problem = buildProblem();
            (problem as any)._id = 'p1';
            problemService.getProblemById.mockResolvedValue(problem);
            const throwingCode = 'function solve(x, y) { throw new Error("boom"); }';

            const result = await service.runCode('p1', throwingCode);

            expect(result.allPassed).toBe(false);
            expect(result.error).toBe('boom');
            expect(result.results).toHaveLength(1);
        });
    });
});