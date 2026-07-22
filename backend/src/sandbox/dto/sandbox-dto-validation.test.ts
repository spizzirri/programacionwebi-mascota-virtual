import { describe, it, expect } from '@jest/globals';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProblemDto } from './create-problem.dto';
import { UpdateProblemDto } from './update-problem.dto';
import { RunCodeDto } from './run-code.dto';

describe('CreateProblemDto', () => {
    const validTestCase = { input: [1, 2], expected: 3, sample: true };

    it('deberia aceptar cuando todos los campos son validos', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'Suma',
            description: 'Desc',
            params: ['a', 'b'],
            testCases: [validTestCase],
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia rechazar cuando title esta vacio', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: '',
            description: 'Desc',
            params: ['a'],
            testCases: [validTestCase],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando description esta vacio', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: '',
            params: ['a'],
            testCases: [validTestCase],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando params no es array de strings', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: 'D',
            params: [1, 2] as any,
            testCases: [validTestCase],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando params esta vacio', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: 'D',
            params: [],
            testCases: [validTestCase],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando testCases no es array', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: 'D',
            params: ['a'],
            testCases: 'not-array' as any,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando un testCase.input no es array', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: 'D',
            params: ['a'],
            testCases: [{ input: 'not-array', expected: 1, sample: true }],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando un testCase.sample es undefined', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: 'D',
            params: ['a'],
            testCases: [{ input: [1], expected: 1 }],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando un testCase.sample no es boolean', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: 'D',
            params: ['a'],
            testCases: [{ input: [1], expected: 1, sample: 'yes' as any }],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia aceptar cuando expected es cualquier valor JSON serializable', async () => {
        const dto = plainToInstance(CreateProblemDto, {
            title: 'T',
            description: 'D',
            params: ['a'],
            testCases: [
                { input: [{ a: 1 }], expected: [1, 2, 3], sample: true },
                { input: ['x'], expected: { ok: true }, sample: false },
                { input: [], expected: null, sample: true },
            ],
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });
});

describe('UpdateProblemDto', () => {
    it('deberia aceptar cuando todos los campos son opcionales y se omite', async () => {
        const dto = plainToInstance(UpdateProblemDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia aceptar cuando se envia solo title', async () => {
        const dto = plainToInstance(UpdateProblemDto, { title: 'Nuevo' });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia rechazar cuando title es string vacio', async () => {
        const dto = plainToInstance(UpdateProblemDto, { title: '' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando params contiene no-strings', async () => {
        const dto = plainToInstance(UpdateProblemDto, { params: [1, 2] as any });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia aceptar cuando active es boolean', async () => {
        const dto = plainToInstance(UpdateProblemDto, { active: false });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia rechazar cuando testCases contiene un item sin sample', async () => {
        const dto = plainToInstance(UpdateProblemDto, {
            testCases: [{ input: [1], expected: 1 }],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});

describe('RunCodeDto', () => {
    it('deberia aceptar cuando problemId es string y code es no-vacio', async () => {
        const dto = plainToInstance(RunCodeDto, { problemId: 'abc', code: 'function solve(){ return 1; }' });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deberia rechazar cuando problemId no es string', async () => {
        const dto = plainToInstance(RunCodeDto, { problemId: 123 as any, code: 'x' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando code es vacio', async () => {
        const dto = plainToInstance(RunCodeDto, { problemId: 'abc', code: '' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('deberia rechazar cuando problemId esta ausente', async () => {
        const dto = plainToInstance(RunCodeDto, { code: 'x' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});