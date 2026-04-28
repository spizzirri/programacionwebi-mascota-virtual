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
import { SessionData } from '../common/types/session.types';

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
            const session: Partial<SessionData> = { userId: '507f1f77bcf86cd799439011' };
            const mockProfile = { _id: new Types.ObjectId("507f1f77bcf86cd799439011"), email: 'test@test.com', streak: 5, createdAt: new Date() } as unknown as UserDocument;

            jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfile);

            const result = await controller.getProfile(session);

            expect(result).toEqual({ profile: mockProfile });
            expect(service.getProfile).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        });

        it('deberia lanzar Error si no hay userId en sesion', async () => {
            const session: Partial<SessionData> = {};

            await expect(controller.getProfile(session)).rejects.toThrow('Not authenticated');
        });
    });

    describe('updateProfilePassword', () => {
        it('deberia actualizar la contrasena si el usuario esta autenticado', async () => {
            const session: Partial<SessionData> = { userId: '507f1f77bcf86cd799439011' };
            const body = { currentPassword: 'oldPassword', newPassword: 'newPassword123' };

            jest.spyOn(service, 'updateProfilePassword').mockResolvedValue({} as unknown as Awaited<ReturnType<typeof service.updateProfilePassword>>);

            const result = await controller.updateProfilePassword(session, body);

            expect(result).toEqual({ success: true });
            expect(service.updateProfilePassword).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'oldPassword', 'newPassword123');
        });

        it('deberia lanzar Error si no hay userId en sesion', async () => {
            const session: Partial<SessionData> = {};
            const body = { currentPassword: 'old', newPassword: 'newPassword123' };

            await expect(controller.updateProfilePassword(session, body)).rejects.toThrow('Not authenticated');
        });
    });

    describe('getHistory', () => {
        it('deberia retornar el historial si el usuario esta autenticado', async () => {
            const session: Partial<SessionData> = { userId: 'user1' };
            const mockHistory = [{ _id: new Types.ObjectId('507f1f77bcf86cd799439011'), questionText: 'Q1' }, { _id: new Types.ObjectId('507f1f77bcf86cd799439012'), questionText: 'Q2' }] as unknown as Awaited<ReturnType<typeof service.getHistory>>;

            jest.spyOn(service, 'getHistory').mockResolvedValue(mockHistory);

            const result = await controller.getHistory(session, '10');

            expect(result).toEqual({ history: mockHistory });
            expect(service.getHistory).toHaveBeenCalledWith('user1', 10);
        });

        it('deberia usar limite de 50 si no se provee query param', async () => {
            const session: Partial<SessionData> = { userId: 'user1' };
            const mockHistory = [] as unknown as Awaited<ReturnType<typeof service.getHistory>>;

            jest.spyOn(service, 'getHistory').mockResolvedValue(mockHistory);

            await controller.getHistory(session, undefined);

            expect(service.getHistory).toHaveBeenCalledWith('user1', 50);
        });

        it('deberia lanzar Error si no hay userId en sesion', async () => {
            const session: Partial<SessionData> = {};

            await expect(controller.getHistory(session)).rejects.toThrow('Not authenticated');
        });
    });

    describe('getAllUsers', () => {
        it('deberia retornar todos los usuarios', async () => {
            const mockUsers = [{ _id: new Types.ObjectId('507f1f77bcf86cd799439011'), email: 'user1@test.com', currentQuestionText: 'Q1' }, { _id: new Types.ObjectId('507f1f77bcf86cd799439012'), email: 'user2@test.com', currentQuestionText: 'Q2' }] as unknown as Awaited<ReturnType<typeof service.getAllUsers>>;

            jest.spyOn(service, 'getAllUsers').mockResolvedValue(mockUsers);

            const result = await controller.getAllUsers();

            expect(result.users).toEqual(mockUsers);
            expect(service.getAllUsers).toHaveBeenCalled();
        });
    });

    describe('createUser', () => {
        it('deberia crear un usuario', async () => {
            const body = { email: 'new@test.com', password: '12345678', role: 'STUDENT', commission: 'NOCHE' };
            const mockUser = { _id: new Types.ObjectId('507f1f77bcf86cd799439011'), email: 'new@test.com' } as unknown as Awaited<ReturnType<typeof service.createUser>>;

            jest.spyOn(service, 'createUser').mockResolvedValue(mockUser);

            const result = await controller.createUser(body);
            expect(result).toEqual({ user: mockUser });
            expect(service.createUser).toHaveBeenCalledWith({ email: 'new@test.com', password: '12345678', role: 'STUDENT', commission: 'NOCHE' });
        });
    });

    describe('updateUser', () => {
        it('deberia actualizar un usuario', async () => {
            const mockUser = { _id: new Types.ObjectId('507f1f77bcf86cd799439011'), email: 'updated@test.com' } as unknown as Awaited<ReturnType<typeof service.updateUser>>;
            jest.spyOn(service, 'updateUser').mockResolvedValue(mockUser);

            const result = await controller.updateUser('u1', { email: 'updated@test.com' });
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
            const mockUser = { _id: new Types.ObjectId('507f1f77bcf86cd799439011'), email: 'user@test.com' } as unknown as Awaited<ReturnType<typeof service.unlockUser>>;
            jest.spyOn(service, 'unlockUser').mockResolvedValue(mockUser);

            const result = await controller.unlockUser('u1');
            expect(result).toEqual({ success: true, message: 'User unlocked successfully' });
            expect(service.unlockUser).toHaveBeenCalledWith('u1');
        });
    });
});
