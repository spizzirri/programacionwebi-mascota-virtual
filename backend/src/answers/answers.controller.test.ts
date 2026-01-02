import { describe, it, expect, jest } from "@jest/globals";
import { AnswersController } from "./answers.controller";
import { AnswersService } from "./answers.service";
import { DatabaseService } from "src/database/database.service";

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


});