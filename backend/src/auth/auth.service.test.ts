
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Define mocks before importing modules to be tested
jest.unstable_mockModule('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

// Dynamic imports to ensure mocks are applied
const bcrypt = await import('bcrypt');
const { AuthService } = await import('./auth.service');
const { DatabaseService } = await import('../database/database.service');

describe('AuthService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('deberia lanzar error si el usuario ya existe', async () => {
            const databaseService = new DatabaseService();
            const authService = new AuthService(databaseService);

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue({
                _id: 'existing',
                email: 'exist@test.com',
                password: 'hashed',
                streak: 0,
                createdAt: new Date()
            });

            await expect(authService.register('exist@test.com', 'pass')).rejects.toThrow('User already exists');
        });

        it('deberia hashear la contraseña y crear el usuario si no existe', async () => {
            const databaseService = new DatabaseService();
            const authService = new AuthService(databaseService);
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

            const createUserSpy = jest.spyOn(databaseService, 'createUser').mockResolvedValue(createdUser);

            const result = await authService.register('new@test.com', 'plain-password');

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
            const databaseService = new DatabaseService();
            const authService = new AuthService(databaseService);

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(null);

            await expect(authService.login('wrong@test.com', 'pass'))
                .rejects.toThrow('Invalid credentials');
        });

        it('deberia lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
            const databaseService = new DatabaseService();
            const authService = new AuthService(databaseService);

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'hashed-real-password',
                streak: 0,
                createdAt: new Date()
            };

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);

            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

            await expect(authService.login('test@test.com', 'wrong-pass'))
                .rejects.toThrow('Invalid credentials');

            expect(bcrypt.compare).toHaveBeenCalledWith('wrong-pass', 'hashed-real-password');
        });

        it('deberia retornar el usuario sin contraseña si el login es exitoso', async () => {
            const databaseService = new DatabaseService();
            const authService = new AuthService(databaseService);
            const now = new Date();

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'hashed-real-password',
                streak: 5,
                createdAt: now
            };

            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);

            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));

            const result = await authService.login('test@test.com', 'correct-pass');

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
            const databaseService = new DatabaseService();
            const authService = new AuthService(databaseService);

            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);

            const result = await authService.getUserById('nonexistent');
            expect(result).toBeNull();
        });

        it('deberia retornar el usuario sin contraseña si existe', async () => {
            const databaseService = new DatabaseService();
            const authService = new AuthService(databaseService);
            const now = new Date();

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'secret',
                streak: 10,
                createdAt: now
            };

            jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser);

            const result = await authService.getUserById('user1');

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
