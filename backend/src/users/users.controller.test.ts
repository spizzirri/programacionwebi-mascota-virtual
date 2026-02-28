import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Types } from "mongoose";
import { UserDocument } from "../database/schemas/user.schema";

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: {
                        getProfile: jest.fn(),
                        getHistory: jest.fn(),
                        getAllUsers: jest.fn(),
                        createUser: jest.fn(),
                        updateUser: jest.fn(),
                        updateProfilePassword: jest.fn(),
                        deleteUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    describe('getProfile', () => {
        it('deberia retornar el perfil si el usuario esta autenticado', async () => {
            const session: any = { userId: '507f1f77bcf86cd799439011' };
            const mockProfile: Partial<UserDocument> = { _id: new Types.ObjectId("507f1f77bcf86cd799439011"), email: 'test@test.com', streak: 5, createdAt: new Date() };

            jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfile as any);

            const result = await controller.getProfile(session);

            expect(result).toEqual({ profile: mockProfile });
        });

        it('deberia lanzar HttpException UNAUTHORIZED si no hay userId en sesion', async () => {
            const session: any = {};

            await expect(controller.getProfile(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });

        it('deberia lanzar HttpException NOT_FOUND si el servicio lanza error (usuario no encontrado)', async () => {
            const session: any = { userId: 'user1' };

            jest.spyOn(service, 'getProfile').mockRejectedValue(new Error('User not found'));

            await expect(controller.getProfile(session)).rejects.toThrow(
                new HttpException('User not found', HttpStatus.NOT_FOUND)
            );
        });
    });

    describe('updateProfilePassword', () => {
        it('deberia actualizar la contrasena si el usuario esta autenticado y provee ambas contrasenas', async () => {
            const session: any = { userId: '507f1f77bcf86cd799439011' };
            const body = { currentPassword: 'oldPassword', newPassword: 'newPassword123' };

            jest.spyOn(service, 'updateProfilePassword').mockResolvedValue({} as any);

            const result = await controller.updateProfilePassword(session, body);

            expect(result).toEqual({ success: true });
            expect(service.updateProfilePassword).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'oldPassword', 'newPassword123');
        });

        it('deberia lanzar HttpException UNAUTHORIZED si no hay userId en sesion', async () => {
            const session: any = {};
            const body = { password: 'newPassword123' };

            await expect(controller.updateProfilePassword(session, body)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });

        it('deberia lanzar HttpException BAD_REQUEST si no se provee la contrasena actual o la nueva', async () => {
            const session: any = { userId: '507f1f77bcf86cd799439011' };
            const body = { newPassword: '123' };

            await expect(controller.updateProfilePassword(session, body)).rejects.toThrow(
                new HttpException('Both current and new password are required', HttpStatus.BAD_REQUEST)
            );
        });

        it('deberia lanzar HttpException BAD_REQUEST si el servicio falla (e.g. contrasena actual incorrecta)', async () => {
            const session: any = { userId: '507f1f77bcf86cd799439011' };
            const body = { currentPassword: 'wrong', newPassword: 'new' };

            jest.spyOn(service, 'updateProfilePassword').mockRejectedValue(new Error('La contraseña actual es incorrecta'));

            await expect(controller.updateProfilePassword(session, body)).rejects.toThrow(
                new HttpException('La contraseña actual es incorrecta', HttpStatus.BAD_REQUEST)
            );
        });
    });

    describe('getHistory', () => {
        it('deberia retornar el historial si el usuario esta autenticado', async () => {
            const session: any = { userId: 'user1' };
            const mockHistory = [{ id: 1 }, { id: 2 }];

            jest.spyOn(service, 'getHistory').mockResolvedValue(mockHistory as any);

            const result = await controller.getHistory(session, '10');

            expect(result).toEqual({ history: mockHistory });
            expect(service.getHistory).toHaveBeenCalledWith('user1', 10);
        });

        it('deberia usar limite de 50 si no se provee query param', async () => {
            const session: any = { userId: 'user1' };
            const mockHistory: any[] = [];

            jest.spyOn(service, 'getHistory').mockResolvedValue(mockHistory);

            await controller.getHistory(session, undefined);

            expect(service.getHistory).toHaveBeenCalledWith('user1', 50);
        });

        it('deberia lanzar HttpException UNAUTHORIZED si no hay userId en sesion', async () => {
            const session: any = {};

            await expect(controller.getHistory(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });
    });

    describe('getAllUsers', () => {
        it('deberia retornar todos los usuarios si el usuario es PROFESSOR', async () => {
            const session: any = { userId: 'admin1' };
            const mockAdmin = { role: 'PROFESSOR' };
            const mockUsers = [{ email: 'user1@test.com' }, { email: 'user2@test.com' }];

            jest.spyOn(service, 'getProfile').mockResolvedValue(mockAdmin as any);
            jest.spyOn(service, 'getAllUsers').mockResolvedValue(mockUsers as any);

            const result = await controller.getAllUsers(session);

            expect(result).toEqual({ users: mockUsers });
            expect(service.getAllUsers).toHaveBeenCalled();
        });

        it('deberia retornar todos los usuarios si se provee un API KEY valido', async () => {
            const session: any = {};
            const mockUsers = [{ email: 'user1@test.com' }];
            process.env.API_KEY = 'valid-key';

            jest.spyOn(service, 'getAllUsers').mockResolvedValue(mockUsers as any);

            const result = await controller.getAllUsers(session, 'valid-key');

            expect(result).toEqual({ users: mockUsers });
        });

        it('deberia lanzar HttpException FORBIDDEN si el usuario no es PROFESSOR y no hay API KEY', async () => {
            const session: any = { userId: 'student1' };
            const mockStudent = { role: 'STUDENT' };

            jest.spyOn(service, 'getProfile').mockResolvedValue(mockStudent as any);

            await expect(controller.getAllUsers(session)).rejects.toThrow(
                new HttpException('Forbidden: Invalid session or API Key', HttpStatus.FORBIDDEN)
            );
        });

        it('deberia lanzar HttpException FORBIDDEN si no hay userId en sesion ni API KEY', async () => {
            const session: any = {};

            await expect(controller.getAllUsers(session)).rejects.toThrow(
                new HttpException('Forbidden: Invalid session or API Key', HttpStatus.FORBIDDEN)
            );
        });
    });

    describe('createUser', () => {
        it('deberia permitir crear un usuario si es PROFESSOR', async () => {
            const session: any = { userId: 'admin1' };
            const body = { email: 'new@test.com', password: '123', role: 'STUDENT' };
            const mockUser = { email: 'new@test.com' };

            jest.spyOn(service, 'getProfile').mockResolvedValue({ role: 'PROFESSOR' } as any);
            jest.spyOn(service, 'createUser').mockResolvedValue(mockUser as any);

            const result = await controller.createUser(body, session);
            expect(result).toEqual({ user: mockUser });
            expect(service.createUser).toHaveBeenCalledWith({ email: 'new@test.com', password: '123', role: 'STUDENT' });
        });

        it('deberia permitir crear un usuario con API KEY', async () => {
            const body = { email: 'new@test.com', role: 'STUDENT' };
            process.env.API_KEY = 'test-key';

            await controller.createUser(body, {}, 'test-key');
            expect(service.createUser).toHaveBeenCalled();
        });

        it('deberia fallar si no es profesor ni tiene api key', async () => {
            const body = { email: 'new@test.com' };
            await expect(controller.createUser(body, {})).rejects.toThrow(HttpException);
        });
    });

    describe('updateUser', () => {
        it('deberia permitir a un PROFESSOR actualizar un usuario', async () => {
            const session: any = { userId: 'admin1' };
            const mockUser = { email: 'updated@test.com' };
            jest.spyOn(service, 'getProfile').mockResolvedValue({ role: 'PROFESSOR' } as any);
            jest.spyOn(service, 'updateUser').mockResolvedValue(mockUser as any);

            const result = await controller.updateUser(session, 'u1', mockUser);
            expect(result).toEqual({ user: mockUser });
        });
    });

    describe('deleteUser', () => {
        it('deberia permitir a un PROFESSOR eliminar un usuario', async () => {
            const session: any = { userId: 'admin1' };
            jest.spyOn(service, 'getProfile').mockResolvedValue({ role: 'PROFESSOR' } as any);
            jest.spyOn(service, 'deleteUser').mockResolvedValue(undefined);

            const result = await controller.deleteUser(session, 'u1');
            expect(result).toEqual({ success: true });
        });
    });
});
