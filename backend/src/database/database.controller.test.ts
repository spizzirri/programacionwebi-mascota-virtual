import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseController } from './database.controller';
import { QuestionService } from '../questions/services/question.service';
import { UserService } from '../users/services/user.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('DatabaseController', () => {
    let controller: DatabaseController;
    let questionService: QuestionService;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DatabaseController],
            providers: [
                {
                    provide: QuestionService,
                    useValue: {
                        getAllQuestions: jest.fn(),
                        createQuestion: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findUserById: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<DatabaseController>(DatabaseController);
        questionService = module.get<QuestionService>(QuestionService);
        userService = module.get<UserService>(UserService);
    });

    describe('seedQuestions', () => {
        it('should seed questions if user is PROFESSOR', async () => {
            const session = { userId: 'prof-id' };
            jest.spyOn(userService, 'findUserById').mockResolvedValue({ role: 'PROFESSOR' } as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([]);
            jest.spyOn(questionService, 'createQuestion').mockResolvedValue({} as any);

            const result = await controller.seedQuestions(session);

            expect(result).toEqual({ message: 'Questions seeded successfully', seeded: true });
        });

        it('should skip seeding if questions already exist', async () => {
            const session = { userId: 'prof-id' };
            jest.spyOn(userService, 'findUserById').mockResolvedValue({ role: 'PROFESSOR' } as any);
            jest.spyOn(questionService, 'getAllQuestions').mockResolvedValue([{ id: 1 }] as any);

            const result = await controller.seedQuestions(session);

            expect(result).toEqual({ message: 'Questions already exist, skipping seed', seeded: false });
            expect(questionService.createQuestion).not.toHaveBeenCalled();
        });

        it('should throw UNAUTHORIZED if no session', async () => {
            const session = {};
            await expect(controller.seedQuestions(session)).rejects.toThrow(
                'Not authenticated'
            );
        });

        it('should throw FORBIDDEN if user is not PROFESSOR', async () => {
            const session = { userId: 'student-id' };
            jest.spyOn(userService, 'findUserById').mockResolvedValue({ role: 'STUDENT' } as any);

            await expect(controller.seedQuestions(session)).rejects.toThrow(
                'Forbidden: Only professors can seed questions'
            );
        });
    });
});
