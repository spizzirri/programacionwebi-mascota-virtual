import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from "./health.service";

describe('HealthService', () => {
    let service: HealthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HealthService],
        }).compile();

        service = module.get<HealthService>(HealthService);
    });

    describe('getPublicHealthStatus', () => {
        it('deberia retornar estado de salud publico sin informacion sensible', () => {
            const result = service.getPublicHealthStatus();

            expect(result).toEqual({
                status: 'ok',
                timestamp: expect.any(String),
            });

            expect(result).not.toHaveProperty('uptime');
            expect(result).not.toHaveProperty('environment');
            expect(result).not.toHaveProperty('message');
        });
    });

    describe('getDetailedHealthStatus', () => {
        it('deberia retornar estado de salud detallado con informacion completa', () => {
            const result = service.getDetailedHealthStatus();

            expect(result).toEqual({
                status: 'ok',
                timestamp: expect.any(String),
                uptime: expect.any(Number),
                environment: expect.any(String),
                message: 'Backend is running correctly',
            });
        });
    });
});
