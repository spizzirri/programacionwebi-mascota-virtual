import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { QuestionsService } from '../questions/questions.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('DatabaseController', () => {
    let controller: DatabaseController;
    let databaseService: DatabaseService;
    let questionsService: QuestionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DatabaseController],
            providers: [
                {
                    provide: DatabaseService,
                    useValue: {
                        findUserById: jest.fn(),
                    },
                },
                {
                    provide: QuestionsService,
                    useValue: {
                        seedQuestions: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<DatabaseController>(DatabaseController);
        databaseService = module.get<DatabaseService>(DatabaseService);
        questionsService = module.get<QuestionsService>(QuestionsService);
    });

    describe('seedQuestions', () => {
        it('should seed questions if user is PROFESSOR', async () => {
            const session = { userId: 'prof-id' };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue({ role: 'PROFESSOR' } as any);

            const result = await controller.seedQuestions(session);

            expect(result).toEqual({ message: 'Questions seeded successfully' });
            expect(questionsService.seedQuestions).toHaveBeenCalled();
        });

        it('should throw UNAUTHORIZED if no session', async () => {
            const session = {};
            await expect(controller.seedQuestions(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });

        it('should throw FORBIDDEN if user is not PROFESSOR', async () => {
            const session = { userId: 'student-id' };
            jest.spyOn(databaseService, 'findUserById').mockResolvedValue({ role: 'STUDENT' } as any);

            await expect(controller.seedQuestions(session)).rejects.toThrow(
                new HttpException('Forbidden: Only professors can seed questions', HttpStatus.FORBIDDEN)
            );
        });
    });
});
