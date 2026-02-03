import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { HttpException, HttpStatus } from "@nestjs/common";

describe('QuestionsController', () => {
    let controller: QuestionsController;
    let service: QuestionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuestionsController],
            providers: [
                {
                    provide: QuestionsService,
                    useValue: {
                        getRandomQuestion: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<QuestionsController>(QuestionsController);
        service = module.get<QuestionsService>(QuestionsService);
    });

    describe('getRandomQuestion', () => {
        it('deberia retornar una pregunta si el usuario esta autenticado', async () => {
            const session: any = { userId: 'user123' };
            const mockQuestion = { _id: '1', text: 'Question?', topic: 'HTML' };
            const mockResponse = { question: mockQuestion, hasAnswered: false };

            jest.spyOn(service, 'getRandomQuestion').mockResolvedValue(mockResponse as any);

            const result = await controller.getRandomQuestion(session);

            expect(result).toEqual(mockResponse);
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
