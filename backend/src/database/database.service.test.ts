
import { describe, it, expect, afterAll, beforeAll } from "@jest/globals";
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
    }, 30000);

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    describe('User Operations', () => {
        it('deberia crear un usuario con rol STUDENT y encontrarlo por ID', async () => {
            const userData = {
                email: 'test@test.com',
                password: 'hashedpassword',
                role: 'STUDENT' as const,
                streak: 0,
                createdAt: new Date()
            };

            const created = await service.createUser(userData);
            expect(created._id).toBeDefined();
            expect(created.email).toBe(userData.email);

            const found = await service.findUserById(created._id.toString());
            expect(found?.email).toBe(created.email);
            expect(found?._id.toString()).toEqual(created._id.toString());
        });

        it('deberia crear un usuario con rol PROFESSOR y encontrarlo por ID', async () => {
            const userData = {
                email: 'professor@test.com',
                password: 'hashedpassword',
                role: 'PROFESSOR' as const,
                streak: 0,
                createdAt: new Date()
            };

            const created = await service.createUser(userData);
            expect(created._id).toBeDefined();
            expect(created.email).toBe(userData.email);

            const found = await service.findUserById(created._id.toString());
            expect(found?.email).toBe(created.email);
            expect(found?._id.toString()).toEqual(created._id.toString());
        });

        it('deberia lanzar error si el rol no es STUDENT o PROFESSOR', async () => {
            const userData = {
                email: 'invalid-role@test.com',
                password: 'hashedpassword',
                role: 'INVALID' as any,
                streak: 0,
                createdAt: new Date()
            };

            await expect(service.createUser(userData)).rejects.toThrow();
        });

        it('deberia encontrar un usuario por email', async () => {
            const userData = {
                email: 'findme@test.com',
                password: 'pwd',
                role: 'STUDENT' as const,
                streak: 0,
                createdAt: new Date()
            };

            await service.createUser(userData);
            const found = await service.findUserByEmail('findme@test.com');
            expect(found).toBeDefined();
            expect(found?.email).toBe('findme@test.com');
        });

        it('deberia retornar null si el usuario no existe', async () => {
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
                role: 'STUDENT' as const,
                streak: 0,
                createdAt: new Date()
            };

            const created = await service.createUser(userData);

            await service.updateUserStreak(created._id.toString(), 5);

            const updated = await service.findUserById(created._id.toString());
            expect(updated?.streak).toBe(5);
            expect(updated?.lastQuestionAnsweredCorrectly).toBeUndefined();
        });

        it('deberia actualizar la racha del usuario y la fecha si se pasa updateLastCorrectDate', async () => {
            const userData = {
                email: 'streak-date@test.com',
                password: 'pwd',
                role: 'STUDENT' as const,
                streak: 0,
                createdAt: new Date()
            };

            const created = await service.createUser(userData);

            await service.updateUserStreak(created._id.toString(), 2, true);

            const updated = await service.findUserById(created._id.toString());
            expect(updated?.streak).toBe(2);
            expect(updated?.lastQuestionAnsweredCorrectly).toBeDefined();
        });

        it('deberia lanzar error al crear usuario duplicado', async () => {
            const userData = {
                email: 'duplicate@test.com',
                password: 'pwd',
                role: 'STUDENT' as const,
                streak: 0,
                createdAt: new Date()
            };

            await service.createUser(userData);
            await expect(service.createUser(userData)).rejects.toThrow();
        });
    });

    describe('Question Operations', () => {
        it('deberia crear y listar preguntas', async () => {
            const q1 = { text: 'Q1', topic: 'HTML' };
            const q2 = { text: 'Q2', topic: 'CSS' };

            await service.createQuestion(q1);
            await service.createQuestion(q2);

            const all = await service.getAllQuestions();
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

            for (let i = 0; i < 5; i++) {
                await service.createAnswer({
                    userId,
                    questionId: `q${i}`,
                    questionText: '?',
                    userAnswer: `A${i}`,
                    rating: 'correct' as const,
                    feedback: 'ok',
                    timestamp: new Date(Date.now() + i * 1000)
                });
            }

            const answers = await service.getAnswersByUserId(userId, 3);
            expect(answers).toHaveLength(3);
            expect(answers[0].userAnswer).toBe('A4');
        });
    });

    describe('Pagination Operations', () => {
        it('deberia retornar usuarios paginados correctamente', async () => {
            // Create multiple users
            for (let i = 0; i < 5; i++) {
                await service.createUser({
                    email: `page-test-${i}@test.com`,
                    password: 'pwd',
                    role: 'STUDENT',
                    streak: 0,
                    createdAt: new Date()
                });
            }

            const page1 = await service.findAllUsersPaginated(1, 2);
            expect(page1.data.length).toBe(2);
            expect(page1.total).toBeGreaterThanOrEqual(5);

            const page2 = await service.findAllUsersPaginated(2, 2);
            expect(page2.data.length).toBe(2);
        });

        it('deberia retornar preguntas paginadas correctamente', async () => {
            const initialCount = (await service.getAllQuestions()).length;

            for (let i = 0; i < 4; i++) {
                await service.createQuestion({ text: `Pag Q${i}`, topic: 'Test' });
            }

            const page1 = await service.getAllQuestionsPaginated(1, 2);
            expect(page1.data.length).toBe(2);
            expect(page1.total).toBe(initialCount + 4);
        });

        it('deberia retornar apelaciones paginadas correctamente', async () => {
            for (let i = 0; i < 3; i++) {
                await service.createAppeal({
                    userId: `user-${i}`,
                    userName: `User ${i}`,
                    answerId: `answer-${i}`,
                    questionId: `q-${i}`,
                    questionText: `Q${i}`,
                    userAnswer: `A${i}`,
                    originalRating: 'incorrect',
                    originalFeedback: 'Try again',
                    status: 'pending',
                    createdAt: new Date(),
                });
            }

            const page1 = await service.getAllAppealsPaginated(1, 2);
            expect(page1.data.length).toBe(2);
            expect(page1.total).toBeGreaterThanOrEqual(3);
        });
    });

    describe('User Lock Operations', () => {
        it('deberia bloquear usuario con lockedUntil en el futuro', async () => {
            const userData = {
                email: 'lock-test@test.com',
                password: 'pwd',
                role: 'STUDENT' as const,
                streak: 0,
                failedLoginAttempts: 0,
                createdAt: new Date()
            };

            await service.createUser(userData);
            const locked = await service.lockUser('lock-test@test.com', 15);

            expect(locked).toBeDefined();
            expect(locked?.failedLoginAttempts).toBe(3);
            expect(locked?.lockedUntil).toBeDefined();
            expect(locked?.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
        });

        it('deberia desbloquear usuario removiendo lockedUntil', async () => {
            const userData = {
                email: 'unlock-test@test.com',
                password: 'pwd',
                role: 'STUDENT' as const,
                streak: 0,
                failedLoginAttempts: 3,
                createdAt: new Date()
            };

            await service.createUser(userData);
            await service.lockUser('unlock-test@test.com', 15);

            const unlocked = await service.unlockUser('unlock-test@test.com');
            expect(unlocked).toBeDefined();
            expect(unlocked?.failedLoginAttempts).toBe(0);
            expect(unlocked?.lockedUntil).toBeUndefined();
        });

        it('deberia resetear failedLoginAttempts y lockedUntil al reset', async () => {
            const userData = {
                email: 'reset-test@test.com',
                password: 'pwd',
                role: 'STUDENT' as const,
                streak: 0,
                failedLoginAttempts: 5,
                createdAt: new Date()
            };

            await service.createUser(userData);
            await service.lockUser('reset-test@test.com', 15);

            await service.resetFailedLoginAttempts('reset-test@test.com');
            const user = await service.findUserByEmail('reset-test@test.com');

            expect(user?.failedLoginAttempts).toBe(0);
            expect(user?.lockedUntil).toBeUndefined();
        });
    });
});
