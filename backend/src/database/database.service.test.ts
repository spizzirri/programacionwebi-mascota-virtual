
import { describe, it, expect, beforeEach } from "@jest/globals";
import { DatabaseService } from "./database.service";

describe('DatabaseService', () => {
    let service: DatabaseService;

    beforeEach(() => {
        service = new DatabaseService();
    });

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

            const found = await service.findUserById(created._id!);
            expect(found).toEqual(created);
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
            const foundById = await service.findUserById('nonexistent');
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

            await service.updateUserStreak(created._id!, 5);

            const updated = await service.findUserById(created._id!);
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
            expect(all).toHaveLength(2);
            expect(all.map(q => q.text)).toContain('Q1');
            expect(all.map(q => q.text)).toContain('Q2');
        });

        it('deberia encontrar preguntas por ID', async () => {
            const q = { text: 'Find Me', topic: 'JS' };
            const created = await service.createQuestion(q);

            const found = await service.getQuestionById(created._id!);
            expect(found).toEqual(created);
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
            expect(answers).toHaveLength(1);
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
                    timestamp: new Date(Date.now() + i) // Tiempos diferentes
                });
            }

            const answers = await service.getAnswersByUserId(userId, 3);
            expect(answers).toHaveLength(3);
            // Deberían ser las más recientes (orden descendente)
            expect(answers[0].userAnswer).toBe('A4');
        });
    });
});
