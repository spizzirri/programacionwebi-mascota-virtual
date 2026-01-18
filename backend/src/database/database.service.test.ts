
import { describe, it, expect, beforeEach, afterAll, beforeAll } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { DatabaseService } from "./database.service";

describe('DatabaseService', () => {
    let service: DatabaseService;
    let module: TestingModule;

    beforeAll(async () => {
        process.env.USE_IN_MEMORY_DB = 'true';
        module = await Test.createTestingModule({
            imports: [DatabaseModule],
        }).compile();

        service = module.get<DatabaseService>(DatabaseService);
    });

    afterAll(async () => {
        await module.close();
    });

    // Clean up collection before each test? 
    // Usually MongoMemoryServer is fresh but here we use one instance.
    // For simplicity, we might tolerate data persistence or add cleanup.
    // For now let's rely on unique data in tests or robust assertions.

    describe('User Operations', () => {
        it('deberia crear y encontrar un usuario por ID', async () => {
            const userData = {
                email: 'test@test.com',
                password: 'hashedpassword',
                streak: 0,
                createdAt: new Date()
            };

            const created = await service.createUser(userData);
            expect(created._id).toBeDefined();
            expect(created.email).toBe(userData.email);

            const found = await service.findUserById(created._id.toString());
            // created and found are Documents. ToEqual compares internal state which might differ slightly (e.g. version key)
            // It's better to compare specific fields or toObject()
            expect(found?.email).toBe(created.email);
            expect(found?._id.toString()).toEqual(created._id.toString());
        });

        it('deberia encontrar un usuario por email', async () => {
            const userData = {
                email: 'findme@test.com',
                password: 'pwd',
                streak: 0,
                createdAt: new Date()
            };

            await service.createUser(userData);
            const found = await service.findUserByEmail('findme@test.com');
            expect(found).toBeDefined();
            expect(found?.email).toBe('findme@test.com');
        });

        it('deberia retornar null si el usuario no existe', async () => {
            // Mongoose creates ObjectId from valid 24 hex string. 'nonexistent' is not valid ObjectId.
            // However, findById might cast or throw.
            // If string is 12 bytes or 24 hex char, it tries to cast.
            // 'nonexistent' (11 chars) will cause CastError if passed directly to _id if we defined _id type.
            // But usually findById(invalidId) throws CastError.
            // We should catch or use a valid-looking fake ID.
            const fakeId = '507f1f77bcf86cd799439011';
            const foundById = await service.findUserById(fakeId);
            expect(foundById).toBeNull();

            const foundByEmail = await service.findUserByEmail('nobody@test.com');
            expect(foundByEmail).toBeNull();
        });

        it('deberia actualizar la racha del usuario', async () => {
            const userData = {
                email: 'streak@test.com',
                password: 'pwd',
                streak: 0,
                createdAt: new Date()
            };

            const created = await service.createUser(userData);

            await service.updateUserStreak(created._id.toString(), 5);

            const updated = await service.findUserById(created._id.toString());
            expect(updated?.streak).toBe(5);
        });
    });

    describe('Question Operations', () => {
        it('deberia crear y listar preguntas', async () => {
            const q1 = { text: 'Q1', topic: 'HTML' };
            const q2 = { text: 'Q2', topic: 'CSS' };

            await service.createQuestion(q1);
            await service.createQuestion(q2);

            const all = await service.getAllQuestions();
            // Since tests run against same DB, might have more questions from previous runs/tests if not cleaned.
            // But expecting "Contain" logic is fine.
            const texts = all.map(q => q.text);
            expect(texts).toContain('Q1');
            expect(texts).toContain('Q2');
        });

        it('deberia encontrar preguntas por ID', async () => {
            const q = { text: 'Find Me', topic: 'JS' };
            const created = await service.createQuestion(q);

            const found = await service.getQuestionById(created._id.toString());
            expect(found?.text).toEqual(created.text);
        });
    });

    describe('Answer Operations', () => {
        it('deberia guardar respuestas y recuperarlas por usuario', async () => {
            const userId = 'user123';
            const answer1 = {
                userId,
                questionId: 'q1',
                questionText: 'Test?',
                userAnswer: 'Yes',
                rating: 'correct' as const,
                feedback: 'Good',
                timestamp: new Date()
            };

            await service.createAnswer(answer1);

            const answers = await service.getAnswersByUserId(userId);
            expect(answers.length).toBeGreaterThanOrEqual(1);
            expect(answers[0].userAnswer).toBe('Yes');
        });

        it('deberia respetar el limite al recuperar respuestas', async () => {
            const userId = 'userLimit';

            // Crear 5 respuestas
            for (let i = 0; i < 5; i++) {
                await service.createAnswer({
                    userId,
                    questionId: `q${i}`,
                    questionText: '?',
                    userAnswer: `A${i}`,
                    rating: 'correct',
                    feedback: 'ok',
                    timestamp: new Date(Date.now() + i * 1000) // Tiempos diferentes para asegurar orden
                });
            }

            const answers = await service.getAnswersByUserId(userId, 3);
            expect(answers).toHaveLength(3);
            // Deberían ser las más recientes (orden descendente)
            // A4 es la ultima creada (timestamp mayor)
            expect(answers[0].userAnswer).toBe('A4');
        });
    });
});

