import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Problem, ProblemDocument } from './schemas/problem.schema';

describe('DatabaseModule - Problem registration', () => {
    let module: TestingModule;
    let mongod: MongoMemoryServer;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        process.env.MONGODB_URI = mongod.getUri();

        module = await Test.createTestingModule({
            imports: [DatabaseModule],
        }).compile();
    }, 60000);

    afterAll(async () => {
        if (module) {
            await module.close();
        }
        if (mongod) {
            await mongod.stop();
        }
        delete process.env.MONGODB_URI;
    });

    it('deberia exponer el model de Problem cuando el modulo se inicializa', () => {
        const model = module.get<Model<ProblemDocument>>(getModelToken(Problem.name));
        expect(model).toBeDefined();
        expect(model.modelName).toBe(Problem.name);
    });

    it('deberia poder persistir y leer un Problem cuando se usa el model registrado', async () => {
        const model = module.get<Model<ProblemDocument>>(getModelToken(Problem.name));
        const created = await model.create({
            title: 'Suma',
            description: 'desc',
            params: ['a', 'b'],
            testCases: [
                { input: [1, 2], expected: 3, sample: true },
                { input: [0, 0], expected: 0, sample: false },
            ],
        });
        expect(created._id).toBeDefined();
        expect(created.active).toBe(true);
        const found = await model.findById(created._id);
        expect(found?.title).toBe('Suma');
        expect(found?.testCases).toHaveLength(2);
    });
});