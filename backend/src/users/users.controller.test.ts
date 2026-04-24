import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { Types } from "mongoose";
import { UserDocument } from "../database/schemas/user.schema";
import { ProfessorGuard } from '../common/guards/professor.guard';
import { DatabaseService } from '../database/database.service';
import { QuestionService } from '../questions/services/question.service';
import { AnswerService } from '../answers/services/answer.service';
import { UserService } from '../users/services/user.service';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    const mockDatabaseService = {
        findUserById: jest.fn(),
    };

    const mockQuestionService = {
        getAllQuestions: jest.fn(),
    };

    const mockAnswerService = {
        getAnswersByUserId: jest.fn(),
    };

    const mockUserService = {
        findAllUsersPaginated: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        unlockUser: jest.fn(),
    };

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
                        getAllUsersPaginated: jest.fn(),
                        createUser: jest.fn(),
                        updateUser: jest.fn(),
                        updateProfilePassword: jest.fn(),
                        deleteUser: jest.fn(),
                        unlockUser: jest.fn(),
                    },
                },
                {
                    provide: ProfessorGuard,
                    useValue: { canActivate: jest.fn().mockReturnValue(true) },
                },
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService,
                },
                {
                    provide: QuestionService,
                    useValue: mockQuestionService,
                },
                {
                    provide: AnswerService,
                    useValue: mockAnswerService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
        }).overrideGuard(ProfessorGuard).useValue({ canActivate: jest.fn().mockReturnValue(true) }).compile();

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
            expect(service.getProfile).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        });

        it('deberia lanzar Error si no hay userId en sesion', async () => {
            const session: any = {};

            await expect(controller.getProfile(session)).rejects.toThrow('Not authenticated');
        });
    });

    describe('updateProfilePassword', () => {
        it('deberia actualizar la contrasena si el usuario esta autenticado', async () => {
            const session: any = { userId: '507f1f77bcf86cd799439011' };
            const body = { currentPassword: 'oldPassword', newPassword: 'newPassword123' };

            jest.spyOn(service, 'updateProfilePassword').mockResolvedValue({} as any);

            const result = await controller.updateProfilePassword(session, body);

            expect(result).toEqual({ success: true });
            expect(service.updateProfilePassword).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'oldPassword', 'newPassword123');
        });

        it('deberia lanzar Error si no hay userId en sesion', async () => {
            const session: any = {};
            const body = { currentPassword: 'old', newPassword: 'newPassword123' };

            await expect(controller.updateProfilePassword(session, body)).rejects.toThrow('Not authenticated');
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

        it('deberia lanzar Error si no hay userId en sesion', async () => {
            const session: any = {};

            await expect(controller.getHistory(session)).rejects.toThrow('Not authenticated');
        });
    });

    describe('getAllUsers', () => {
        it('deberia retornar usuarios paginados', async () => {
            const mockUsers: any[] = [{ email: 'user1@test.com' }, { email: 'user2@test.com' }];

            jest.spyOn(service, 'getAllUsersPaginated').mockResolvedValue({ data: mockUsers, total: 2 });

            const result = await controller.getAllUsers('1', '10');

            expect(result.users.data).toEqual(mockUsers);
            expect(result.users.meta.page).toBe(1);
            expect(result.users.meta.limit).toBe(10);
            expect(service.getAllUsersPaginated).toHaveBeenCalledWith(1, 10);
        });
    });

    describe('createUser', () => {
        it('deberia crear un usuario', async () => {
            const body = { email: 'new@test.com', password: '12345678', role: 'STUDENT' };
            const mockUser = { email: 'new@test.com' };

            jest.spyOn(service, 'createUser').mockResolvedValue(mockUser as any);

            const result = await controller.createUser(body);
            expect(result).toEqual({ user: mockUser });
            expect(service.createUser).toHaveBeenCalledWith({ email: 'new@test.com', password: '12345678', role: 'STUDENT' });
        });
    });

    describe('updateUser', () => {
        it('deberia actualizar un usuario', async () => {
            const mockUser = { email: 'updated@test.com' };
            jest.spyOn(service, 'updateUser').mockResolvedValue(mockUser as any);

            const result = await controller.updateUser('u1', { email: 'updated@test.com' } as any);
            expect(result).toEqual({ user: mockUser });
        });
    });

    describe('deleteUser', () => {
        it('deberia eliminar un usuario', async () => {
            jest.spyOn(service, 'deleteUser').mockResolvedValue(undefined);

            const result = await controller.deleteUser('u1');
            expect(result).toEqual({ success: true });
        });
    });

    describe('unlockUser', () => {
        it('deberia desbloquear un usuario', async () => {
            jest.spyOn(service, 'unlockUser').mockResolvedValue({ email: 'user@test.com' } as any);

            const result = await controller.unlockUser('u1');
            expect(result).toEqual({ success: true, message: 'User unlocked successfully' });
            expect(service.unlockUser).toHaveBeenCalledWith('u1');
        });
    });
});
