import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import type { UsersService as UsersServiceType } from "./users.service";
import type { UserService as UserServiceType } from "./services/user.service";
import type { QuestionService as QuestionServiceType } from "../questions/services/question.service";
import type { AnswerService as AnswerServiceType } from "../answers/services/answer.service";
import { UserService } from "./services/user.service";
import { QuestionService } from "../questions/services/question.service";
import { AnswerService } from "../answers/services/answer.service";
import { Types } from "mongoose";

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

const bcrypt = jest.requireMock('bcrypt') as { hash: jest.Mock; compare: jest.Mock };

let UsersService: typeof import('./users.service').UsersService;

beforeAll(async () => {
    const userMod = await import('./users.service');
    UsersService = userMod.UsersService;
});

describe('UsersService', () => {
    let service: UsersServiceType;
    let userService: UserServiceType;
    let questionService: QuestionServiceType;
    let answerService: AnswerServiceType;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: UserService,
                    useValue: {
                        findUserById: jest.fn(),
                        createUser: jest.fn(),
                        updateUser: jest.fn(),
                        deleteUser: jest.fn(),
                        unlockUser: jest.fn(),
                        findAllUsers: jest.fn(),
                    },
                },
                {
                    provide: QuestionService,
                    useValue: {
                        getAllQuestions: jest.fn(),
                    },
                },
                {
                    provide: AnswerService,
                    useValue: {
                        getAnswersByUserId: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersServiceType>(UsersService);
        userService = module.get<UserService>(UserService);
        questionService = module.get<QuestionService>(QuestionService);
        answerService = module.get<AnswerService>(AnswerService);

        process.env.REGISTRATION_SECRET = 'student-secret';
        process.env.ADMIN_SECRET = 'admin-secret';
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('deberia retornar el perfil del usuario sin contraseña', async () => {
            const mockUser = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                email: 'test@test.com',
                password: 'secret',
                streak: 5,
                role: 'STUDENT',
                createdAt: new Date(),
                toObject: () => ({
                    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                    email: 'test@test.com',
                    password: 'secret',
                    streak: 5,
                    role: 'STUDENT',
                    createdAt: new Date(),
                }),
            } as unknown as Awaited<ReturnType<UserServiceType['findUserById']>>;
            jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);

            const profile = await service.getProfile('user1');

            expect((profile as any).password).toBeUndefined();
            expect(profile.email).toBe('test@test.com');
            expect(userService.findUserById).toHaveBeenCalledWith('user1');
        });

        it('deberia lanzar error si el usuario no existe', async () => {
            jest.spyOn(userService, 'findUserById').mockResolvedValue(null);

            await expect(service.getProfile('nonexistent')).rejects.toThrow('User not found');
        });
    });

    describe('getHistory', () => {
        it('deberia retornar el historial de respuestas del usuario', async () => {
            const mockAnswers = [{ _id: new Types.ObjectId('507f1f77bcf86cd799439011'), questionText: 'Q1' }, { _id: new Types.ObjectId('507f1f77bcf86cd799439012'), questionText: 'Q2' }] as unknown as Awaited<ReturnType<AnswerServiceType['getAnswersByUserId']>>;
            jest.spyOn(answerService, 'getAnswersByUserId').mockResolvedValue(mockAnswers);

            const history = await service.getHistory('user1', 10);

            expect(history).toEqual(mockAnswers);
            expect(answerService.getAnswersByUserId).toHaveBeenCalledWith('user1', 10);
        });

        it('deberia usar el limite por defecto si no se especifica', async () => {
            jest.spyOn(answerService, 'getAnswersByUserId').mockResolvedValue([] as unknown as Awaited<ReturnType<AnswerServiceType['getAnswersByUserId']>>);

            await service.getHistory('user1');

            expect(answerService.getAnswersByUserId).toHaveBeenCalledWith('user1', 50);
        });
    });

    describe('getAllUsers', () => {
        it('deberia retornar todos los usuarios sin contraseña y con el texto de la pregunta actual', async () => {
            const questionId = new Types.ObjectId('507f1f77bcf86cd799439011');
            const mockUsers = [{
                _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
                email: 'user1@test.com',
                password: 'secret',
                currentQuestionId: questionId.toString(),
                toObject: () => ({
                    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
                    email: 'user1@test.com',
                    password: 'secret',
                    currentQuestionId: questionId.toString(),
                }),
            }] as unknown as Awaited<ReturnType<UserServiceType['findAllUsers']>>;
            const mockQuestions = [{ _id: questionId, text: 'What is HTML?' }] as unknown as Awaited<ReturnType<QuestionServiceType['getAllQuestions']>>;
            jest.spyOn(userService, 'findAllUsers').mockResolvedValue(mockUsers);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue(mockQuestions);

            const users = await service.getAllUsers();

            expect((users[0] as any).password).toBeUndefined();
            expect(users[0].currentQuestionText).toBe('What is HTML?');
        });
    });

    describe('createUser', () => {
        it('deberia registrar un STUDENT correctamente con el secreto', async () => {
            (bcrypt.hash as any).mockResolvedValue('hashed');
            jest.spyOn(userService, 'createUser').mockResolvedValue({ _id: new Types.ObjectId('507f1f77bcf86cd799439011'), email: 'new@test.com' } as unknown as Awaited<ReturnType<UserServiceType['createUser']>>);

            await service.createUser({ email: 'new@test.com', password: 'pass', role: 'STUDENT', secret: 'student-secret' });

            expect(bcrypt.hash).toHaveBeenCalledWith('pass', 12);
            expect(userService.createUser).toHaveBeenCalled();
        });

        it('deberia registrar un PROFESSOR correctamente', async () => {
            (bcrypt.hash as any).mockResolvedValue('hashed');
            jest.spyOn(userService, 'createUser').mockResolvedValue({ _id: new Types.ObjectId('507f1f77bcf86cd799439011'), email: 'prof@test.com' } as unknown as Awaited<ReturnType<UserServiceType['createUser']>>);

            await service.createUser({ email: 'prof@test.com', password: 'pass', role: 'PROFESSOR', secret: 'admin-secret' });

            expect(userService.createUser).toHaveBeenCalled();
        });
    });

    describe('updateProfilePassword', () => {
        it('deberia actualizar la contraseña si la actual es correcta', async () => {
            const mockUser = { password: 'hashedOld' } as unknown as Awaited<ReturnType<UserServiceType['findUserById']>>;
            jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(true);
            (bcrypt.hash as any).mockResolvedValue('hashedNew');
            jest.spyOn(userService, 'updateUser').mockResolvedValue({ _id: new Types.ObjectId('507f1f77bcf86cd799439011') } as unknown as Awaited<ReturnType<UserServiceType['updateUser']>>);

            await service.updateProfilePassword('user1', 'oldPass', 'newPass');

            expect(bcrypt.compare).toHaveBeenCalledWith('oldPass', 'hashedOld');
            expect(userService.updateUser).toHaveBeenCalledWith('user1', { password: 'hashedNew' });
        });

        it('deberia lanzar error si la contraseña actual es incorrecta', async () => {
            const mockUser = { password: 'hashedOld' } as unknown as Awaited<ReturnType<UserServiceType['findUserById']>>;
            jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(false);

            await expect(service.updateProfilePassword('user1', 'wrongPass', 'newPass'))
                .rejects.toThrow('La contraseña actual es incorrecta');
        });
    });

    it('deberia llamar a updateUser', async () => {
        jest.spyOn(userService, 'updateUser').mockResolvedValue({ _id: new Types.ObjectId('507f1f77bcf86cd799439011') } as unknown as Awaited<ReturnType<UserServiceType['updateUser']>>);
        await service.updateUser('u1', { email: 'new@test.com' });
        expect(userService.updateUser).toHaveBeenCalled();
    });

    it('deberia llamar a deleteUser', async () => {
        jest.spyOn(userService, 'deleteUser').mockResolvedValue(undefined);
        await service.deleteUser('u1');
        expect(userService.deleteUser).toHaveBeenCalled();
    });
});
