import { describe, it, expect, jest } from "@jest/globals";
import { AnswersController } from "./answers.controller";
import { AnswersService } from "./answers.service";
import { DatabaseService } from "src/database/database.service";
import { SubmitAnswerResult } from "./answers.service";

describe('AnswersController', () => {

    it('deberia lanzar una excepcion si no llega la sesión del usuario', async () => {

        const databaseService = new DatabaseService();
        const answersService = new AnswersService(databaseService);
        const controller = new AnswersController(answersService);

        const sampleBody = { questionId: '1', questionText: 'question', userAnswer: 'answer' };
        await expect(controller.submitAnswer(sampleBody, {})).rejects.toThrow();
    })

    it('deberia lanzar una excepcion si no llega el id del usuario en la sesión', async () => {

        const databaseService = new DatabaseService();
        const answersService = new AnswersService(databaseService);
        const controller = new AnswersController(answersService);

        const sampleBody = { questionId: '1', questionText: 'question', userAnswer: 'answer' };
        await expect(controller.submitAnswer(sampleBody, { userId: null } as any)).rejects.toThrow();
    })

    it("deberia devolver la respuesta { success: true, rating: 'correct', feedback: 'feedback', newStreak: 1 } validar la respuesta del usuario", async () => {

        const databaseService = new DatabaseService();
        const answersService = new AnswersService(databaseService);
        const controller = new AnswersController(answersService);

        const sampleResponse: SubmitAnswerResult = {
            answer: {
                questionId: '1', questionText: 'question', userAnswer: 'answer', rating: 'correct', feedback: 'feedback', timestamp: new Date(),
                userId: ""
            }, newStreak: 1
        };

        const expectedResponse = {
            success: true,
            rating: 'correct',
            feedback: 'feedback',
            newStreak: 1
        };

        jest.spyOn(answersService, 'submitAnswer').mockResolvedValue(sampleResponse);

        const answerResult = await controller.submitAnswer({ questionId: '1', questionText: 'question', userAnswer: 'answer' }, { userId: '1' });
        expect(answerResult).toEqual(expectedResponse);
    })

});