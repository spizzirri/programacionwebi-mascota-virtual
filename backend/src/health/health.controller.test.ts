import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe('HealthController', () => {
    let controller: HealthController;
    let service: HealthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: HealthService,
                    useValue: {
                        getHealthStatus: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        service = module.get<HealthService>(HealthService);
    });

    describe('checkHealth', () => {
        it('deberia retornar el resultado del servicio health', async () => {
            const expectedResult = {
                status: 'ok',
                timestamp: '2023-01-01T00:00:00.000Z',
                uptime: 100,
                environment: 'test',
                message: 'Backend is running correctly'
            };

            jest.spyOn(service, 'getHealthStatus').mockReturnValue(expectedResult);

            const result = await controller.checkHealth();

            expect(result).toEqual(expectedResult);
            expect(service.getHealthStatus).toHaveBeenCalled();
        });
    });
});
