import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { AnswersController } from "./answers.controller";
import { AnswersService } from "./answers.service";
import { SubmitAnswerResult } from "./answers.service";

describe('AnswersController', () => {
    let controller: AnswersController;
    let service: AnswersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AnswersController],
            providers: [
                {
                    provide: AnswersService,
                    useValue: {
                        submitAnswer: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AnswersController>(AnswersController);
        service = module.get<AnswersService>(AnswersService);
    });

    it('deberia lanzar una excepcion si no llega la sesión del usuario', async () => {
        const sampleBody = { questionId: '1', userAnswer: 'answer' };
        await expect(controller.submitAnswer(sampleBody, {})).rejects.toThrow();
    });

    it('deberia lanzar una excepcion si no llega el id del usuario en la sesión', async () => {
        const sampleBody = { questionId: '1', userAnswer: 'answer' };
        await expect(controller.submitAnswer(sampleBody, { userId: null } as any)).rejects.toThrow();
    });

    it("deberia devolver la respuesta { success: true, rating: 'correct', feedback: 'feedback', newStreak: 1 } validar la respuesta del usuario", async () => {
        const sampleResponse: SubmitAnswerResult = {
            answer: {
                questionId: '1',
                questionText: 'question',
                userAnswer: 'answer',
                rating: 'correct' as const,
                feedback: 'feedback',
                timestamp: new Date(),
                userId: "1",
                streakAtMoment: 0
            },
            newStreak: 1
        };

        const expectedResponse = {
            success: true,
            rating: 'correct',
            feedback: 'feedback',
            newStreak: 1
        };

        (service.submitAnswer as any).mockResolvedValue(sampleResponse);

        const answerResult = await controller.submitAnswer({ questionId: '1', userAnswer: 'answer' }, { userId: '1' });
        expect(answerResult).toEqual(expectedResponse);
    });
});