import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserService } from './user.service';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MINUTES } from '../../common/constants/auth.constants';

describe('UserService', () => {
    let service: UserService;
    let mockUserModel: Model<UserDocument>;
    let mockQuery: any;

    beforeEach(() => {
        mockQuery = {
            exec: jest.fn(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
        };

        mockUserModel = jest.fn().mockImplementation((data: Partial<UserDocument>) => {
            const mockInstance: Partial<UserDocument> = Object.assign({}, data);
            (mockInstance.save as any) = jest.fn<any>().mockResolvedValue(Object.assign({}, data, { _id: new Types.ObjectId() }));
            return mockInstance;
        }) as unknown as Model<UserDocument>;

        (mockUserModel as any).findOne = jest.fn().mockReturnValue(mockQuery);
        (mockUserModel as any).findById = jest.fn().mockReturnValue(mockQuery);
        (mockUserModel as any).find = jest.fn().mockReturnValue(mockQuery);
        (mockUserModel as any).findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
        (mockUserModel as any).findOneAndUpdate = jest.fn().mockReturnValue(mockQuery);
        (mockUserModel as any).updateOne = jest.fn().mockReturnValue(mockQuery);
        (mockUserModel as any).findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);
        (mockUserModel as any).countDocuments = jest.fn().mockReturnValue(mockQuery);

        service = new UserService(mockUserModel);
    });

    describe('createUser', () => {
        it('deberia crear un usuario correctamente', async () => {
            const userData = { email: 'test@test.com', password: 'hashed', role: 'STUDENT' };
            const mockId = new Types.ObjectId();
            const savedUser = { ...userData, _id: mockId };
            
            const mockInstance: Partial<UserDocument> = { ...userData };
            mockInstance.save = jest.fn<any>().mockResolvedValue(savedUser);
            (mockUserModel as unknown as jest.Mock).mockReturnValue(mockInstance);

            const result = await service.createUser(userData);

            expect(result.email).toEqual(userData.email);
            expect(result.role).toEqual(userData.role);
            expect(result._id).toBeDefined();
        });
    });

    describe('findUserByEmail', () => {
        it('deberia retornar un usuario por email', async () => {
            const user = { email: 'test@test.com' };
            mockQuery.exec.mockResolvedValue(user);

            const result = await service.findUserByEmail('test@test.com');

            expect(result).toEqual(user);
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
        });

        it('deberia retornar null si no encuentra el usuario', async () => {
            mockQuery.exec.mockResolvedValue(null);

            const result = await service.findUserByEmail('nonexistent@test.com');

            expect(result).toBeNull();
        });
    });

    describe('findUserById', () => {
        it('deberia retornar un usuario por id', async () => {
            const user = { _id: 'user-123', email: 'test@test.com' };
            mockQuery.exec.mockResolvedValue(user);

            const result = await service.findUserById('user-123');

            expect(result).toEqual(user);
        });
    });

    describe('findAllUsers', () => {
        it('deberia retornar todos los usuarios', async () => {
            const users = [{ email: 'user1@test.com' }, { email: 'user2@test.com' }];
            mockQuery.exec.mockResolvedValue(users);

            const result = await service.findAllUsers();

            expect(result).toEqual(users);
        });
    });

    describe('updateUser', () => {
        it('deberia actualizar un usuario', async () => {
            const updatedUser = { email: 'updated@test.com' };
            mockQuery.exec.mockResolvedValue(updatedUser);

            const result = await service.updateUser('user-123', { email: 'updated@test.com' });

            expect(result).toEqual(updatedUser);
        });
    });

    describe('deleteUser', () => {
        it('deberia eliminar un usuario', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.deleteUser('user-123');

            expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('user-123');
        });
    });

    describe('incrementFailedLoginAttempts', () => {
        it('deberia incrementar los intentos fallidos', async () => {
            const user = { email: 'test@test.com', failedLoginAttempts: 1 };
            mockQuery.exec.mockResolvedValue(user);

            const result = await service.incrementFailedLoginAttempts('test@test.com');

            expect(result).toEqual(user);
        });
    });

    describe('resetFailedLoginAttempts', () => {
        it('deberia resetear los intentos fallidos', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.resetFailedLoginAttempts('test@test.com');

            expect(mockUserModel.updateOne).toHaveBeenCalledWith(
                { email: 'test@test.com' },
                { $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: '' } },
            );
        });
    });

    describe('lockUser', () => {
        it('deberia bloquear un usuario por 15 minutos por defecto', async () => {
            const lockedUser = { email: 'test@test.com', lockedUntil: new Date() };
            mockQuery.exec.mockResolvedValue(lockedUser);

            const result = await service.lockUser('test@test.com');

            expect(result).toEqual(lockedUser);
        });

        it('deberia bloquear un usuario por el tiempo especificado', async () => {
            const lockedUser = { email: 'test@test.com', lockedUntil: new Date() };
            mockQuery.exec.mockResolvedValue(lockedUser);

            await service.lockUser('test@test.com', 30);

            expect(mockUserModel.findOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe('unlockUser', () => {
        it('deberia desbloquear un usuario', async () => {
            const unlockedUser = { email: 'test@test.com', failedLoginAttempts: 0 };
            mockQuery.exec.mockResolvedValue(unlockedUser);

            const result = await service.unlockUser('test@test.com');

            expect(result).toEqual(unlockedUser);
        });
    });

    describe('updateUserStreak', () => {
        it('deberia actualizar el streak sin fecha', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.updateUserStreak('user-123', 5, false);

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'user-123',
                { streak: 5 },
            );
        });

        it('deberia actualizar el streak con fecha', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.updateUserStreak('user-123', 5, true);

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
        });
    });

    describe('assignQuestionToUser', () => {
        it('deberia asignar una pregunta al usuario', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.assignQuestionToUser('user-123', 'question-456');

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
        });
    });

    describe('isUserLocked', () => {
        it('deberia retornar isLocked false si los intentos son menores a 3', async () => {
            const user = { failedLoginAttempts: 2 } as UserDocument;

            const result = await service.isUserLocked(user);

            expect(result).toEqual({ isLocked: false });
        });

        it('deberia retornar isLocked false si no hay lockedUntil', async () => {
            const user = { failedLoginAttempts: 3 } as UserDocument;

            const result = await service.isUserLocked(user);

            expect(result).toEqual({ isLocked: false });
        });

        it('deberia retornar isLocked true si el usuario esta bloqueado', async () => {
            const lockedUntil = new Date(Date.now() + 10 * 60000); // 10 minutos en el futuro
            const user = { failedLoginAttempts: 3, lockedUntil } as UserDocument;

            const result = await service.isUserLocked(user);

            expect(result.isLocked).toBe(true);
            expect(result.minutesLeft).toBeGreaterThan(0);
        });

        it('deberia retornar isLocked false si el bloqueo expiro', async () => {
            const lockedUntil = new Date(Date.now() - 10 * 60000); // 10 minutos en el pasado
            const user = { failedLoginAttempts: 3, lockedUntil } as UserDocument;

            const result = await service.isUserLocked(user);

            expect(result).toEqual({ isLocked: false });
        });
    });

    describe('autoUnlockUser', () => {
        it('deberia desbloquear automaticamente un usuario', async () => {
            mockQuery.exec.mockResolvedValue(undefined);

            await service.autoUnlockUser('test@test.com');

            expect(mockUserModel.updateOne).toHaveBeenCalled();
        });
    });
});
