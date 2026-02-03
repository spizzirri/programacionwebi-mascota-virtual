import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from "./users.service";
import { DatabaseService } from "../database/database.service";

describe('UsersService', () => {
    let service: UsersService;
    let databaseService: DatabaseService;

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
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        databaseService = module.get<DatabaseService>(DatabaseService);
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
        it('deberia retornar todos los usuarios sin contraseña', async () => {
            const mockUsers = [
                { email: 'u1@t.com', password: 'pw1', toObject: function () { return this; } },
                { email: 'u2@t.com', password: 'pw2', toObject: function () { return this; } }
            ];

            jest.spyOn(databaseService, 'findAllUsers').mockResolvedValue(mockUsers as any);

            const result = await service.getAllUsers();

            expect(result).toHaveLength(2);
            expect(result[0].email).toBe('u1@t.com');
            expect((result[0] as any).password).toBeUndefined();
            expect(result[1].email).toBe('u2@t.com');
            expect((result[1] as any).password).toBeUndefined();
        });
    });
});
