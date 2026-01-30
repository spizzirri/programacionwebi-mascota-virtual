import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { HttpException, HttpStatus } from "@nestjs/common";

describe('AuthController', () => {

    let authService: AuthService;
    let controller: AuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        register: jest.fn(),
                        login: jest.fn(),
                        logout: jest.fn(),
                        getUserById: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    describe('register', () => {
        it('deberia registrar un usuario correctamente y establecer la sesión', async () => {
            const body = { email: 'test@test.com', password: 'password123', role: 'STUDENT' };
            const session: any = {};
            const mockUser = { _id: 'user123', email: 'test@test.com', role: 'STUDENT', streak: 0, createdAt: new Date() };

            jest.spyOn(authService, 'register').mockResolvedValue(mockUser);

            const result = await controller.register(body, session);

            expect(result).toEqual({ success: true, user: mockUser });
            expect(session.userId).toBe('user123');
            expect(authService.register).toHaveBeenCalledWith(body.email, body.password, body.role);
        });

        it('deberia lanzar HttpException con BAD_REQUEST si el servicio falla (ej. usuario ya existe)', async () => {
            const body = { email: 'existing@test.com', password: 'password123', role: 'STUDENT' };
            const session: any = {};

            jest.spyOn(authService, 'register').mockRejectedValue(new Error('User already exists'));

            await expect(controller.register(body, session)).rejects.toThrow(
                new HttpException('User already exists', HttpStatus.BAD_REQUEST)
            );
            expect(session.userId).toBeUndefined();
        });
    });

    describe('login', () => {
        it('deberia loguear un usuario correctamente y establecer la sesión', async () => {
            const body = { email: 'test@test.com', password: 'password123' };
            const session: any = {};
            const mockUser = { _id: 'user123', email: 'test@test.com', role: 'STUDENT', streak: 0, createdAt: new Date() };

            jest.spyOn(authService, 'login').mockResolvedValue(mockUser);

            const result = await controller.login(body, session);

            expect(result).toEqual({ success: true, user: mockUser });
            expect(session.userId).toBe('user123');
            expect(authService.login).toHaveBeenCalledWith(body.email, body.password);
        });

        it('deberia lanzar HttpException con UNAUTHORIZED si las credenciales son invalidas', async () => {
            const body = { email: 'test@test.com', password: 'wrongpassword' };
            const session: any = {};

            jest.spyOn(authService, 'login').mockRejectedValue(new Error('Invalid credentials'));

            await expect(controller.login(body, session)).rejects.toThrow(
                new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED)
            );
            expect(session.userId).toBeUndefined();
        });
    });

    describe('logout', () => {
        it('deberia eliminar el userId de la sesión al cerrar sesión', async () => {
            const session: any = { userId: 'user123' };

            const result = await controller.logout(session);

            expect(result).toEqual({ success: true });
            expect(session.userId).toBeUndefined();
        });
    });

    describe('getCurrentUser', () => {
        it('deberia retornar el usuario si la sesión es valida', async () => {
            const session: any = { userId: 'user123' };
            const mockUser = { _id: 'user123', email: 'test@test.com', role: 'STUDENT', streak: 0, createdAt: new Date() };

            jest.spyOn(authService, 'getUserById').mockResolvedValue(mockUser);

            const result = await controller.getCurrentUser(session);

            expect(result).toEqual({ user: mockUser });
            expect(authService.getUserById).toHaveBeenCalledWith('user123');
        });

        it('deberia lanzar HttpException con UNAUTHORIZED si no hay userId en la sesión', async () => {
            const session: any = {};

            await expect(controller.getCurrentUser(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });

        it('deberia lanzar HttpException con NOT_FOUND si el usuarios no existe en base de datos', async () => {
            const session: any = { userId: 'nonexistent' };

            jest.spyOn(authService, 'getUserById').mockResolvedValue(null);

            await expect(controller.getCurrentUser(session)).rejects.toThrow(
                new HttpException('User not found', HttpStatus.NOT_FOUND)
            );
        });
    });

});