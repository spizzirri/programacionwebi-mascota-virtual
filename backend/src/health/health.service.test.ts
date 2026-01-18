
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { HealthService } from "./health.service";

describe('HealthService', () => {
    let service: HealthService;

    beforeEach(() => {
        service = new HealthService();
    });

    describe('getHealthStatus', () => {
        it('deberia retornar el estado de salud de la aplicacion con status ok', () => {
            const result = service.getHealthStatus();

            expect(result).toEqual({
                status: 'ok',
                timestamp: expect.any(String),
                uptime: expect.any(Number),
                environment: expect.any(String),
                message: 'Backend is running correctly'
            });
        });
    });
});
