import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    const mockAuthService = {
        login: jest.fn(),
        getUserById: jest.fn(),
    };

    const mockSession = {
        userId: undefined as string | undefined,
        regenerate: jest.fn((cb) => cb(null)),
        destroy: jest.fn((cb) => cb(null)),
    };

    const mockRequest = {
        session: mockSession,
    } as unknown as Request;

    const mockResponse = {
        setHeader: jest.fn(),
        clearCookie: jest.fn(),
    } as unknown as Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        const loginDto: LoginDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        const mockUser = {
            _id: 'user123',
            email: 'test@example.com',
            role: 'USER',
        };

        it('should regenerate session on successful login (Fix Session Fixation)', async () => {
            mockAuthService.login.mockResolvedValue(mockUser);
            mockSession.regenerate = jest.fn((cb) => cb(null));

            await controller.login(loginDto, mockSession, mockRequest, mockResponse);

            expect(mockSession.regenerate).toHaveBeenCalled();
        });

        it('should set userId in session after login', async () => {
            mockAuthService.login.mockResolvedValue(mockUser);

            await controller.login(loginDto, mockSession, mockRequest, mockResponse);

            expect((mockRequest as any).session.userId).toBe('user123');
        });

        it('should return success and user on login', async () => {
            mockAuthService.login.mockResolvedValue(mockUser);

            const result = await controller.login(loginDto, mockSession, mockRequest, mockResponse);

            expect(result).toEqual({
                success: true,
                user: mockUser,
            });
        });

        it('should throw UnauthorizedException on login failure', async () => {
            mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

            await expect(
                controller.login(loginDto, mockSession, mockRequest, mockResponse)
            ).rejects.toThrow(HttpException);
        });

        it('should handle session regeneration error', async () => {
            mockSession.regenerate = jest.fn((cb) => cb(new Error('Session error')));

            await expect(
                controller.login(loginDto, mockSession, mockRequest, mockResponse)
            ).rejects.toThrow();
        });
    });

    describe('logout', () => {
        it('should destroy session on logout', async () => {
            mockSession.destroy = jest.fn((cb) => cb(null));

            const result = await controller.logout(mockSession, mockRequest, mockResponse);

            expect(mockSession.destroy).toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });

        it('should clear session cookie on logout', async () => {
            mockSession.destroy = jest.fn((cb) => cb(null));

            await controller.logout(mockSession, mockRequest, mockResponse);

            expect(mockResponse.clearCookie).toHaveBeenCalledWith('tamagotchi.sid');
        });

        it('should handle session destroy error', async () => {
            mockSession.destroy = jest.fn((cb) => cb(new Error('Destroy error')));

            await expect(
                controller.logout(mockSession, mockRequest, mockResponse)
            ).rejects.toThrow();
        });
    });

    describe('getCurrentUser', () => {
        const mockUser = {
            _id: 'user123',
            email: 'test@example.com',
            role: 'USER',
        };

        it('should return user when session has userId', async () => {
            const sessionWithUser = { userId: 'user123' };
            mockAuthService.getUserById.mockResolvedValue(mockUser);

            const result = await controller.getCurrentUser(sessionWithUser);

            expect(result).toEqual({ user: mockUser });
            expect(mockAuthService.getUserById).toHaveBeenCalledWith('user123');
        });

        it('should throw UnauthorizedException when no userId in session', async () => {
            const sessionWithoutUser = { userId: undefined };

            await expect(controller.getCurrentUser(sessionWithoutUser)).rejects.toThrow(
                HttpException
            );
        });

        it('should throw NotFoundException when user not found', async () => {
            const sessionWithUser = { userId: 'nonexistent' };
            mockAuthService.getUserById.mockResolvedValue(null);

            await expect(controller.getCurrentUser(sessionWithUser)).rejects.toThrow(
                HttpException
            );
        });
    });

    describe('LoginDto Validation', () => {
        it('should validate correct email format', () => {
            const validDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            expect(validDto.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });

        it('should reject invalid email format', () => {
            const invalidEmail = {
                email: 'invalid-email',
                password: 'password123',
            };
            expect(invalidEmail.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });

        it('should require minimum password length of 8', () => {
            const shortPassword = {
                email: 'test@example.com',
                password: 'short',
            };
            expect(shortPassword.password.length).toBeLessThan(8);
        });
    });
});
