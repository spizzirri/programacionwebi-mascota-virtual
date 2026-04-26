import { describe, it, expect, jest, beforeEach, beforeAll } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import type { UsersService as UsersServiceType } from "./users.service";
import type { UserService as UserServiceType } from "./services/user.service";
import type { QuestionService as QuestionServiceType } from "../questions/services/question.service";
import type { AnswerService as AnswerServiceType } from "../answers/services/answer.service";
import { UserService } from "./services/user.service";
import { QuestionService } from "../questions/services/question.service";
import { AnswerService } from "../answers/services/answer.service";

jest.unstable_mockModule('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

let bcrypt: any;
let UsersService: any;

beforeAll(async () => {
    bcrypt = await import('bcrypt');
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
                _id: 'user1',
                email: 'test@test.com',
                password: 'secret',
                streak: 5,
                role: 'STUDENT',
                createdAt: new Date(),
                toObject: () => ({
                    _id: 'user1',
                    email: 'test@test.com',
                    password: 'secret',
                    streak: 5,
                    role: 'STUDENT',
                    createdAt: new Date(),
                }),
            };
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(mockUser as any);

            const profile = await service.getProfile('user1');

            expect((profile as any).password).toBeUndefined();
            expect(profile.email).toBe('test@test.com');
            expect(userService.findUserById).toHaveBeenCalledWith('user1');
        });

        it('deberia lanzar error si el usuario no existe', async () => {
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(null);

            await expect(service.getProfile('nonexistent')).rejects.toThrow('User not found');
        });
    });

    describe('getHistory', () => {
        it('deberia retornar el historial de respuestas del usuario', async () => {
            const mockAnswers = [{ id: 'a1', questionText: 'Q1' }, { id: 'a2', questionText: 'Q2' }];
            jest.spyOn(answerService as any, 'getAnswersByUserId').mockResolvedValue(mockAnswers as any);

            const history = await service.getHistory('user1', 10);

            expect(history).toEqual(mockAnswers);
            expect(answerService.getAnswersByUserId).toHaveBeenCalledWith('user1', 10);
        });

        it('deberia usar el limite por defecto si no se especifica', async () => {
            jest.spyOn(answerService as any, 'getAnswersByUserId').mockResolvedValue([]);

            await service.getHistory('user1');

            expect(answerService.getAnswersByUserId).toHaveBeenCalledWith('user1', 50);
        });
    });

    describe('getAllUsers', () => {
        it('deberia retornar todos los usuarios sin contraseña y con el texto de la pregunta actual', async () => {
            const mockUsers = [{
                _id: 'u1',
                email: 'user1@test.com',
                password: 'secret',
                currentQuestionId: 'q1',
                toObject: () => ({
                    _id: 'u1',
                    email: 'user1@test.com',
                    password: 'secret',
                    currentQuestionId: 'q1',
                }),
            }];
            const mockQuestions = [{ _id: 'q1', text: 'What is HTML?' }];
            jest.spyOn(userService as any, 'findAllUsers').mockResolvedValue(mockUsers as any);
            jest.spyOn(questionService as any, 'getAllQuestions').mockResolvedValue(mockQuestions as any);

            const users = await service.getAllUsers();

            expect((users[0] as any).password).toBeUndefined();
            expect(users[0].currentQuestionText).toBe('What is HTML?');
        });
    });

    describe('createUser', () => {
        it('deberia registrar un STUDENT correctamente con el secreto', async () => {
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as any);
            jest.spyOn(userService as any, 'createUser').mockResolvedValue({ email: 'new@test.com' } as any);

            await service.createUser({ email: 'new@test.com', password: 'pass', role: 'STUDENT', secret: 'student-secret' });

            expect(bcrypt.hash).toHaveBeenCalledWith('pass', 12);
            expect(userService.createUser).toHaveBeenCalled();
        });

        it('deberia registrar un PROFESSOR correctamente', async () => {
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as any);
            jest.spyOn(userService as any, 'createUser').mockResolvedValue({ email: 'prof@test.com' } as any);

            await service.createUser({ email: 'prof@test.com', password: 'pass', role: 'PROFESSOR', secret: 'admin-secret' });

            expect(userService.createUser).toHaveBeenCalled();
        });
    });

    describe('updateProfilePassword', () => {
        it('deberia actualizar la contraseña si la actual es correcta', async () => {
            const mockUser = { password: 'hashedOld' };
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedNew' as any);
            jest.spyOn(userService as any, 'updateUser').mockResolvedValue({} as any);

            await service.updateProfilePassword('user1', 'oldPass', 'newPass');

            expect(bcrypt.compare).toHaveBeenCalledWith('oldPass', 'hashedOld');
            expect(userService.updateUser).toHaveBeenCalledWith('user1', { password: 'hashedNew' });
        });

        it('deberia lanzar error si la contraseña actual es incorrecta', async () => {
            const mockUser = { password: 'hashedOld' };
            jest.spyOn(userService as any, 'findUserById').mockResolvedValue(mockUser as any);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

            await expect(service.updateProfilePassword('user1', 'wrongPass', 'newPass'))
                .rejects.toThrow('La contraseña actual es incorrecta');
        });
    });

    it('deberia llamar a updateUser', async () => {
        jest.spyOn(userService as any, 'updateUser').mockResolvedValue({} as any);
        await service.updateUser('u1', { email: 'new@test.com' });
        expect(userService.updateUser).toHaveBeenCalled();
    });

    it('deberia llamar a deleteUser', async () => {
        jest.spyOn(userService as any, 'deleteUser').mockResolvedValue(undefined);
        await service.deleteUser('u1');
        expect(userService.deleteUser).toHaveBeenCalled();
    });
});
