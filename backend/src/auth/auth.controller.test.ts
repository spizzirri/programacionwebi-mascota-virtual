import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ThrottlerModule } from '@nestjs/throttler';

describe('AuthController', () => {

    let authService: AuthService;
    let controller: AuthController;

    const mockSession = {
        userId: undefined as string | undefined,
        regenerate: jest.fn((cb: (err: Error | null) => void) => cb(null)),
        destroy: jest.fn((cb: (err: Error | null) => void) => cb(null)),
    };

    const mockRequest = {
        session: mockSession,
    } as any;

    const mockResponse = {
        setHeader: jest.fn(),
        clearCookie: jest.fn(),
        json: jest.fn().mockImplementation((val) => val),
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            ],
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        login: jest.fn(),
                        getUserById: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });


    describe('login', () => {
        it('deberia loguear un usuario correctamente y regenerar la sesion (Fix Session Fixation)', async () => {
            const body = { email: 'test@test.com', password: 'password123' };
            const session: any = {};
            const mockUser = { _id: 'user123', email: 'test@test.com', role: 'STUDENT', streak: 0, failedLoginAttempts: 0, createdAt: new Date() };

            jest.spyOn(authService, 'login').mockResolvedValue(mockUser);

            await controller.login(body as any, session, mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, user: mockUser });
            expect(mockSession.regenerate).toHaveBeenCalled();
            expect(authService.login).toHaveBeenCalledWith(body.email, body.password);
        });

        it('deberia lanzar Error si las credenciales son invalidas', async () => {
            const body = { email: 'test@test.com', password: 'wrongpassword' };
            const session: any = {};

            jest.spyOn(authService, 'login').mockRejectedValue(new Error('usuario o contraseña incorrectos'));

            await expect(controller.login(body as any, session, mockRequest, mockResponse)).rejects.toThrow(
                'usuario o contraseña incorrectos'
            );
        });
    });

    describe('logout', () => {
        it('deberia destruir la sesion completamente al cerrar sesion', async () => {
            const session: any = { userId: 'user123' };

            await controller.logout(session, mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
            expect(mockSession.destroy).toHaveBeenCalled();
            expect(mockResponse.clearCookie).toHaveBeenCalledWith('tamagotchi.sid');
        });
    });

    describe('getCurrentUser', () => {
        it('deberia retornar el usuario si la sesion es valida', async () => {
            const session: any = { userId: 'user123' };
            const mockUser = { _id: 'user123', email: 'test@test.com', role: 'STUDENT', streak: 0, failedLoginAttempts: 0, createdAt: new Date() };

            jest.spyOn(authService, 'getUserById').mockResolvedValue(mockUser);

            const result = await controller.getCurrentUser(session);

            expect(result).toEqual({ user: mockUser });
            expect(authService.getUserById).toHaveBeenCalledWith('user123');
        });

        it('deberia lanzar Error si no hay userId en la sesion', async () => {
            const session: any = {};

            await expect(controller.getCurrentUser(session)).rejects.toThrow(
                'Not authenticated'
            );
        });

        it('deberia lanzar Error si el usuario no existe en base de datos', async () => {
            const session: any = { userId: 'nonexistent' };

            jest.spyOn(authService, 'getUserById').mockResolvedValue(null);

            await expect(controller.getCurrentUser(session)).rejects.toThrow(
                'User not found'
            );
        });
    });

});
