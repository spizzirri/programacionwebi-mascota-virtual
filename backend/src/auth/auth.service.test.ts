import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthService as AuthServiceType } from './auth.service';
import type { UserService as UserServiceType } from '../users/services/user.service';
import { UserService } from '../users/services/user.service';

jest.unstable_mockModule('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

let bcrypt: any;
let AuthService: any;

beforeAll(async () => {
    bcrypt = await import('bcrypt');
    const authMod = await import('./auth.service');
    AuthService = authMod.AuthService;
});

describe('AuthService', () => {
    let service: AuthServiceType;
    let userService: UserServiceType;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: {
                        findUserByEmail: jest.fn(),
                        findUserById: jest.fn(),
                        updateUserStreak: jest.fn(),
                        incrementFailedLoginAttempts: jest.fn(),
                        resetFailedLoginAttempts: jest.fn(),
                        lockUser: jest.fn(),
                        unlockUser: jest.fn(),
                        isUserLocked: jest.fn(),
                        autoUnlockUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthServiceType>(AuthService);
        userService = module.get<UserService>(UserService);

        process.env.REGISTRATION_SECRET = 'student-secret';
        process.env.ADMIN_SECRET = 'admin-secret';

        jest.clearAllMocks();
    });


    describe('login', () => {
        it('deberia lanzar UnauthorizedException si el usuario no existe (mitigacion de timing attack)', async () => {
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(null);
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

            await expect(service.login('nonexistent@test.com', 'wrongpass'))
                .rejects.toThrow('usuario o contraseña incorrectos');
        });

        it('deberia lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
            const mockUser = { email: 'test@test.com', password: 'hashed', role: 'STUDENT', failedLoginAttempts: 0 };
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(mockUser as any);
            jest.spyOn(userService as any, 'isUserLocked').mockResolvedValue({ isLocked: false });
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

            await expect(service.login('test@test.com', 'wrongpass'))
                .rejects.toThrow('usuario o contraseña incorrectos');
        });

        it('deberia retornar el usuario sin contraseña si el login es exitoso', async () => {
            const mockUser = {
                email: 'test@test.com',
                password: 'hashed',
                role: 'STUDENT',
                failedLoginAttempts: 0,
                toObject: () => ({
                    email: 'test@test.com',
                    password: 'hashed',
                    role: 'STUDENT',
                    failedLoginAttempts: 0,
                }),
            };
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(mockUser as any);
            jest.spyOn(userService as any, 'isUserLocked').mockResolvedValue({ isLocked: false });
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));
            jest.spyOn(userService as any, 'resetFailedLoginAttempts').mockResolvedValue(undefined);

            const result = await service.login('test@test.com', 'correctpass');

            expect(result.password).toBeUndefined();
            expect(userService.resetFailedLoginAttempts).toHaveBeenCalled();
        });

        it('deberia reiniciar la racha a 0 si la ultima respuesta correcta fue antes de ayer a las 00:00', async () => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const mockUser = {
                email: 'test@test.com',
                password: 'hashed',
                role: 'STUDENT',
                failedLoginAttempts: 0,
                lastQuestionAnsweredCorrectly: twoDaysAgo,
                streak: 5,
                _id: 'user123',
                toObject: () => ({
                    email: 'test@test.com',
                    password: 'hashed',
                    role: 'STUDENT',
                    failedLoginAttempts: 0,
                    lastQuestionAnsweredCorrectly: twoDaysAgo,
                    streak: 5,
                    _id: 'user123',
                }),
            };
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(mockUser as any);
            jest.spyOn(userService as any, 'isUserLocked').mockResolvedValue({ isLocked: false });
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));
            jest.spyOn(userService as any, 'resetFailedLoginAttempts').mockResolvedValue(undefined);
            const updateStreakSpy = jest.spyOn(userService as any, 'updateUserStreak').mockResolvedValue(undefined);

            await service.login('test@test.com', 'correctpass');

            expect(updateStreakSpy).toHaveBeenCalledWith('user123', 0);
        });

        it('no deberia reiniciar la racha si la ultima respuesta correcta fue ayer', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const mockUser = {
                email: 'test@test.com',
                password: 'hashed',
                role: 'STUDENT',
                failedLoginAttempts: 0,
                lastQuestionAnsweredCorrectly: yesterday,
                streak: 5,
                _id: 'user123',
                toObject: () => ({
                    email: 'test@test.com',
                    password: 'hashed',
                    role: 'STUDENT',
                    failedLoginAttempts: 0,
                    lastQuestionAnsweredCorrectly: yesterday,
                    streak: 5,
                    _id: 'user123',
                }),
            };
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(mockUser as any);
            jest.spyOn(userService as any, 'isUserLocked').mockResolvedValue({ isLocked: false });
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));
            jest.spyOn(userService as any, 'resetFailedLoginAttempts').mockResolvedValue(undefined);
            const updateStreakSpy = jest.spyOn(userService as any, 'updateUserStreak').mockResolvedValue(undefined);

            await service.login('test@test.com', 'correctpass');

            expect(updateStreakSpy).not.toHaveBeenCalled();
        });
    });

    describe('getUserById', () => {
        it('deberia retornar null si el usuario no existe', async () => {
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(null);

            const result = await service.getUserById('nonexistent');

            expect(result).toBeNull();
        });

        it('deberia retornar el usuario sin contraseña si existe', async () => {
            const mockUser = {
                email: 'test@test.com',
                password: 'hashed',
                role: 'STUDENT',
                toObject: () => ({
                    email: 'test@test.com',
                    password: 'hashed',
                    role: 'STUDENT',
                }),
            };
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(mockUser as any);

            const result = await service.getUserById('user123');

            expect(result).toEqual({ email: 'test@test.com', role: 'STUDENT' });
        });
    });

    describe('login - lock mechanism', () => {
        it('deberia lanzar UnauthorizedException si el usuario esta bloqueado y el lock no ha expirado', async () => {
            const lockedUntil = new Date(Date.now() + 10 * 60000);
            const mockUser = {
                email: 'test@test.com',
                failedLoginAttempts: 3,
                lockedUntil,
            };
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(mockUser as any);
            jest.spyOn(userService as any, 'isUserLocked').mockResolvedValue({ isLocked: true, minutesLeft: 10 });

            await expect(service.login('test@test.com', 'anypass'))
                .rejects.toThrow('usuario bloqueado, intente nuevamente en 10 minutos');
        });

        it('deberia desbloquear automaticamente si el lock ha expirado y permitir login correcto', async () => {
            const expiredLock = new Date(Date.now() - 10 * 60000);
            const mockUser = {
                email: 'test@test.com',
                password: 'hashed',
                failedLoginAttempts: 3,
                lockedUntil: expiredLock,
                role: 'STUDENT',
                toObject: () => ({
                    email: 'test@test.com',
                    password: 'hashed',
                    failedLoginAttempts: 3,
                    lockedUntil: expiredLock,
                    role: 'STUDENT',
                }),
            };
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(mockUser as any);
            jest.spyOn(userService as any, 'isUserLocked').mockResolvedValue({ isLocked: false });
            jest.spyOn(userService as any, 'autoUnlockUser').mockResolvedValue(undefined);
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(true));
            jest.spyOn(userService as any, 'resetFailedLoginAttempts').mockResolvedValue(undefined);

            const result = await service.login('test@test.com', 'correctpass');

            expect(userService.autoUnlockUser).toHaveBeenCalledWith('test@test.com');
            expect(result).toBeDefined();
        });

        it('deberia bloquear al usuario tras 3 intentos fallidos', async () => {
            const mockUser = {
                email: 'test@test.com',
                password: 'hashed',
                failedLoginAttempts: 2,
                role: 'STUDENT',
            };
            const updatedUser = {
                email: 'test@test.com',
                failedLoginAttempts: 3,
            };
            jest.spyOn(userService as any, 'findUserByEmail').mockResolvedValue(mockUser as any);
            jest.spyOn(userService as any, 'isUserLocked').mockResolvedValue({ isLocked: false });
            jest.spyOn(userService as any, 'incrementFailedLoginAttempts').mockResolvedValue(updatedUser as any);
            jest.spyOn(userService as any, 'lockUser').mockResolvedValue(updatedUser as any);
            (bcrypt.compare as jest.Mock).mockReturnValue(Promise.resolve(false));

            await expect(service.login('test@test.com', 'wrongpass'))
                .rejects.toThrow('usuario bloqueado por 15 minutos');

            expect(userService.lockUser).toHaveBeenCalledWith('test@test.com');
        });
    });
});
