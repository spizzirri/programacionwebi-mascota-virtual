import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import type { UsersService as UsersServiceType } from "./users.service";
import type { DatabaseService as DatabaseServiceType } from "../database/database.service";

jest.unstable_mockModule('bcrypt', () => ({
    hash: jest.fn(),
}));

let bcrypt: any;
let UsersService: any;
let DatabaseService: any;

beforeAll(async () => {
    bcrypt = await import('bcrypt');
    const userMod = await import('./users.service');
    UsersService = userMod.UsersService;
    const dbMod = await import('../database/database.service');
    DatabaseService = dbMod.DatabaseService;
});

describe('UsersService', () => {
    let service: UsersServiceType;
    let databaseService: DatabaseServiceType;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: DatabaseService,
                    useValue: {
                        findUserById: jest.fn(),
                        getAnswersByUserId: jest.fn(),
                        findAllUsers: jest.fn(),
                        getAllQuestions: jest.fn(),
                        createUser: jest.fn(),
                        updateUser: jest.fn(),
                        deleteUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersServiceType>(UsersService);
        databaseService = module.get<DatabaseServiceType>(DatabaseService);

        process.env.REGISTRATION_SECRET = 'student-secret';
        process.env.ADMIN_SECRET = 'admin-secret';
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('deberia retornar el perfil del usuario sin contraseña', async () => {
            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'secret',
                streak: 5,
                createdAt: new Date()
            };

            jest.spyOn(databaseService, 'findUserById').mockResolvedValue({
                ...mockUser,
                toObject: () => mockUser
            } as any);

            const result = await service.getProfile('user1');

            expect(result).toEqual({
                _id: 'user1',
                email: 'test@test.com',
                streak: 5,
                createdAt: mockUser.createdAt
            });
            expect((result as any).password).toBeUndefined();
        });

        it('deberia lanzar error si el usuario no existe', async () => {
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);

            await expect(service.getProfile('nonexistent')).rejects.toThrow('User not found');
        });
    });

    describe('getHistory', () => {
        it('deberia retornar el historial de respuestas del usuario', async () => {
            const mockAnswers = [{ userAnswer: 'a' }, { userAnswer: 'b' }] as any;

            jest.spyOn(databaseService, 'getAnswersByUserId').mockResolvedValue(mockAnswers);

            const result = await service.getHistory('user1', 10);

            expect(result).toEqual(mockAnswers);
            expect(databaseService.getAnswersByUserId).toHaveBeenCalledWith('user1', 10);
        });

        it('deberia usar el limite por defecto si no se especifica', async () => {
            jest.spyOn(databaseService, 'getAnswersByUserId').mockResolvedValue([]);

            await service.getHistory('user1');

            expect(databaseService.getAnswersByUserId).toHaveBeenCalledWith('user1', 50);
        });
    });

    describe('getAllUsers', () => {
        it('deberia retornar todos los usuarios sin contraseña y con el texto de la pregunta actual', async () => {
            const mockUsers = [
                { _id: 'u1', email: 'u1@t.com', password: 'pw1', currentQuestionId: 'q1', toObject: function () { return this; } },
                { _id: 'u2', email: 'u2@t.com', password: 'pw2', toObject: function () { return this; } }
            ];
            const mockQuestions = [
                { _id: 'q1', text: 'Question 1' }
            ];

            jest.spyOn(databaseService, 'findAllUsers').mockResolvedValue(mockUsers as any);
            jest.spyOn(databaseService, 'getAllQuestions').mockResolvedValue(mockQuestions as any);

            const result = await service.getAllUsers();

            expect(result).toHaveLength(2);
            expect(result[0].email).toBe('u1@t.com');
            expect(result[0].currentQuestionText).toBe('Question 1');
            expect((result[0] as any).password).toBeUndefined();
            expect(result[1].email).toBe('u2@t.com');
            expect(result[1].currentQuestionText).toBe('-');
            expect((result[1] as any).password).toBeUndefined();
        });
    });

    describe('createUser', () => {
        it('deberia registrar un STUDENT correctamente con el secreto', async () => {
            const data = { email: 'new@t.com', password: '123', role: 'STUDENT' };
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed' as never);
            jest.spyOn(databaseService, 'createUser').mockResolvedValue({ ...data, password: 'hashed' } as any);

            const result = await service.createUser(data);
            expect(result).toBeDefined();
            expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
            expect(databaseService.createUser).toHaveBeenCalledWith({ ...data, password: 'hashed' });
        });

        it('deberia registrar un PROFESSOR correctamente', async () => {
            const data = { email: 'admin@t.com', password: '123', role: 'PROFESSOR' };
            jest.spyOn(databaseService, 'createUser').mockResolvedValue(data as any);

            const result = await service.createUser(data);
            expect(result).toBeDefined();
        });
    });

    it('deberia llamar a updateUser', async () => {
        const data = { email: 'upd@t.com' };
        await service.updateUser('1', data);
        expect(databaseService.updateUser).toHaveBeenCalledWith('1', data);
    });

    it('deberia llamar a deleteUser', async () => {
        await service.deleteUser('1');
        expect(databaseService.deleteUser).toHaveBeenCalledWith('1');
    });
});
