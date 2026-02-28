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
                        updateUserStreak: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthServiceType>(AuthService);
        databaseService = module.get<DatabaseServiceType>(DatabaseService);

        process.env.REGISTRATION_SECRET = 'student-secret';
        process.env.ADMIN_SECRET = 'admin-secret';

        jest.clearAllMocks();
    });


    describe('login', () => {
        it('deberia lanzar UnauthorizedException si el usuario no existe (mitigacion de timing attack)', async () => {
            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(null);
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

            await expect(service.login('wrong@test.com', 'pass'))
                .rejects.toThrow('Invalid credentials');

            expect(bcrypt.compare).toHaveBeenCalled();
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

        it('deberia reiniciar la racha a 0 si la ultima respuesta correcta fue antes de ayer a las 00:00', async () => {
            const now = new Date();
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const missedDay = new Date(startOfToday);
            missedDay.setDate(missedDay.getDate() - 2);

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                password: 'hashed-real-password',
                streak: 5,
                lastQuestionAnsweredCorrectly: missedDay,
                createdAt: now
            };

            const userDoc: any = { ...mockUser };
            userDoc.toObject = () => userDoc;
            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(userDoc);

            const updateStreakSpy = jest.spyOn(databaseService, 'updateUserStreak').mockResolvedValue(undefined);
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));

            const result = await service.login('test@test.com', 'correct-pass');

            expect(updateStreakSpy).toHaveBeenCalledWith('user1', 0);
            expect(result.streak).toBe(0);
        });

        it('no deberia reiniciar la racha si la ultima respuesta correcta fue ayer', async () => {
            const now = new Date();
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const yesterdayValid = new Date(startOfToday);
            yesterdayValid.setDate(yesterdayValid.getDate() - 1);
            yesterdayValid.setHours(23, 0, 0, 0);

            const mockUser = {
                _id: 'user2',
                email: 'test2@test.com',
                password: 'hashed-real-password',
                streak: 3,
                lastQuestionAnsweredCorrectly: yesterdayValid,
                createdAt: now
            };

            const userDoc: any = { ...mockUser };
            userDoc.toObject = () => userDoc;
            jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(userDoc);

            const updateStreakSpy = jest.spyOn(databaseService, 'updateUserStreak').mockResolvedValue(undefined);
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));

            const result = await service.login('test2@test.com', 'correct-pass');

            expect(updateStreakSpy).not.toHaveBeenCalled();
            expect(result.streak).toBe(3);
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
