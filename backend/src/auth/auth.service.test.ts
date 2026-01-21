import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthService as AuthServiceType } from './auth.service';
import type { DatabaseService as DatabaseServiceType } from '../database/database.service';

jest.unstable_mockModule('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

let bcrypt: any;
let AuthService: any;
let DatabaseService: any;

beforeAll(async () => {
    bcrypt = await import('bcrypt');
    const authMod = await import('./auth.service');
    AuthService = authMod.AuthService;
    const dbMod = await import('../database/database.service');
    DatabaseService = dbMod.DatabaseService;
});

describe('AuthService', () => {
    let service: AuthServiceType;
    let databaseService: DatabaseServiceType;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: DatabaseService,
                    useValue: {
                        findUserByEmail: jest.fn(),
                        findUserById: jest.fn(),
                        createUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthServiceType>(AuthService);
        databaseService = module.get<DatabaseServiceType>(DatabaseService);
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('deberia lanzar error si el usuario ya existe', async () => {

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue({
                _id: 'existing',
                email: 'exist@test.com',
                password: 'hashed',
                streak: 0,
                createdAt: new Date()
            } as any);

            await expect(service.register('exist@test.com', 'pass')).rejects.toThrow('User already exists');
        });

        it('deberia hashear la contraseña y crear el usuario si no existe', async () => {
            const now = new Date();

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(null);

            (bcrypt.hash as jest.Mock).mockReturnValue(Promise.resolve('hashed-password'));

            const createdUser = {
                _id: 'new-user',
                email: 'new@test.com',
                password: 'hashed-password',
                streak: 0,
                createdAt: now
            };

            const createUserSpy = jest.spyOn(databaseService, 'createUser').mockResolvedValue({
                ...createdUser,
                toObject: () => createdUser
            } as any);

            const result = await service.register('new@test.com', 'plain-password');

            expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
            expect(createUserSpy).toHaveBeenCalledWith({
                email: 'new@test.com',
                password: 'hashed-password',
                streak: 0,
                createdAt: expect.any(Date)
            });
            expect(result).toEqual({
                _id: 'new-user',
                email: 'new@test.com',
                streak: 0,
                createdAt: now
            });
            expect((result as any).password).toBeUndefined();
        });
    });

    describe('login', () => {
        it('deberia lanzar UnauthorizedException si el usuario no existe', async () => {
            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(null);

            await expect(service.login('wrong@test.com', 'pass'))
                .rejects.toThrow('Invalid credentials');
        });

        it('deberia lanzar UnauthorizedException si la contraseña es incorrecta', async () => {

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'hashed-real-password',
                streak: 0,
                createdAt: new Date()
            };

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue({
                ...mockUser,
                toObject: () => mockUser
            } as any);

            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

            await expect(service.login('test@test.com', 'wrong-pass'))
                .rejects.toThrow('Invalid credentials');

            expect(bcrypt.compare).toHaveBeenCalledWith('wrong-pass', 'hashed-real-password');
        });

        it('deberia retornar el usuario sin contraseña si el login es exitoso', async () => {
            const now = new Date();

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'hashed-real-password',
                streak: 5,
                createdAt: now
            };

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue({
                ...mockUser,
                toObject: () => mockUser
            } as any);

            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));

            const result = await service.login('test@test.com', 'correct-pass');

            expect(result).toEqual({
                _id: 'user1',
                email: 'test@test.com',
                streak: 5,
                createdAt: now
            });
            expect((result as any).password).toBeUndefined();
        });
    });

    describe('getUserById', () => {
        it('deberia retornar null si el usuario no existe', async () => {
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);

            const result = await service.getUserById('nonexistent');
            expect(result).toBeNull();
        });

        it('deberia retornar el usuario sin contraseña si existe', async () => {
            const now = new Date();

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'secret',
                streak: 10,
                createdAt: now
            };

            jest.spyOn(databaseService, 'findUserById').mockResolvedValue({
                ...mockUser,
                toObject: () => mockUser
            } as any);

            const result = await service.getUserById('user1');

            expect(result).toEqual({
                _id: 'user1',
                email: 'test@test.com',
                streak: 10,
                createdAt: now
            });
            expect((result as any).password).toBeUndefined();
        });
    });
});
