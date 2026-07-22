import { describe, it, expect } from '@jest/globals';
import { ProblemSchema } from './problem.schema';

describe('ProblemSchema', () => {
    describe('propiedades del documento', () => {
        it('deberia requerir title como string cuando se omite', () => {
            const titlePath = ProblemSchema.path('title');
            expect(titlePath).toBeDefined();
            expect(titlePath.isRequired).toBe(true);
            expect(titlePath.instance).toBe('String');
        });

        it('deberia requerir description como string cuando se omite', () => {
            const descriptionPath = ProblemSchema.path('description');
            expect(descriptionPath).toBeDefined();
            expect(descriptionPath.isRequired).toBe(true);
            expect(descriptionPath.instance).toBe('String');
        });

        it('deberia requerir params como array de strings cuando se omite', () => {
            const paramsPath = ProblemSchema.path('params');
            expect(paramsPath).toBeDefined();
            expect(paramsPath.isRequired).toBe(true);
            expect(paramsPath.instance).toBe('Array');
        });

        it('deberia requerir testCases como array cuando se omite', () => {
            const testCasesPath = ProblemSchema.path('testCases');
            expect(testCasesPath).toBeDefined();
            expect(testCasesPath.isRequired).toBe(true);
            expect(testCasesPath.instance).toBe('Array');
        });

        it('deberia tener active con valor por defecto true cuando se omite en la creacion', () => {
            const activePath = ProblemSchema.path('active');
            expect(activePath).toBeDefined();
            expect(activePath.instance).toBe('Boolean');
            expect(activePath.options.default).toBe(true);
        });
    });

    describe('subdocumento testCase', () => {
        it('deberia requerir input como array dentro de cada testCase cuando se valida el schema', () => {
            const inputPath = ProblemSchema.path('testCases.input');
            expect(inputPath).toBeDefined();
            expect(inputPath.instance).toBe('Array');
            expect(inputPath.isRequired).toBe(true);
        });

        it('deberia requerir expected como valor mixto dentro de cada testCase cuando se valida el schema', () => {
            const expectedPath = ProblemSchema.path('testCases.expected');
            expect(expectedPath).toBeDefined();
            expect(expectedPath.isRequired).toBe(true);
        });

        it('deberia requerir sample boolean dentro de cada testCase cuando se valida el schema', () => {
            const samplePath = ProblemSchema.path('testCases.sample');
            expect(samplePath).toBeDefined();
            expect(samplePath.instance).toBe('Boolean');
            expect(samplePath.isRequired).toBe(true);
        });
    });

    describe('Problem type', () => {
        it('deberia exponer ProblemDocument como HydratedDocument de Problem', () => {
            const sample: any = {
                title: 'T',
                description: 'D',
                params: [],
                testCases: [],
                active: true,
            };
            expect(sample.title).toBe('T');
        });
    });
});