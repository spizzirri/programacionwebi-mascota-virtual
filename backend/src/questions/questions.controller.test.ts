
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { DatabaseService } from "../database/database.service";
import { HttpException, HttpStatus } from "@nestjs/common";

describe('QuestionsController', () => {
    let controller: QuestionsController;
    let service: QuestionsService;
    let databaseService: DatabaseService;

    beforeEach(() => {
        databaseService = new DatabaseService();
        service = new QuestionsService(databaseService);
        controller = new QuestionsController(service);
    });

    describe('getRandomQuestion', () => {
        it('deberia retornar una pregunta si el usuario esta autenticado', async () => {
            const session: any = { userId: 'user123' };
            const mockQuestion = { _id: '1', text: 'Question?', topic: 'HTML' };

            jest.spyOn(service, 'getRandomQuestion').mockResolvedValue(mockQuestion);

            const result = await controller.getRandomQuestion(session);

            expect(result).toEqual({ question: mockQuestion });
            expect(service.getRandomQuestion).toHaveBeenCalled();
        });

        it('deberia lanzar HttpException UNAUTHORIZED si no hay userId en la sesion', async () => {
            const session: any = {};

            await expect(controller.getRandomQuestion(session)).rejects.toThrow(
                new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
            );
        });
    });
});
