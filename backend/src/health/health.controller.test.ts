import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HttpException, HttpStatus } from '@nestjs/common';

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
                        getPublicHealthStatus: jest.fn(),
                        getDetailedHealthStatus: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        service = module.get<HealthService>(HealthService);
    });

    describe('checkHealth (public)', () => {
        it('should return basic health status without sensitive info', async () => {
            const mockResponse = {
                status: 'ok',
                timestamp: '2024-01-01T00:00:00.000Z',
            };

            jest.spyOn(service, 'getPublicHealthStatus').mockReturnValue(mockResponse as any);

            const result = await controller.checkHealth();

            expect(result).toEqual(mockResponse);
            expect(result).not.toHaveProperty('uptime');
            expect(result).not.toHaveProperty('environment');
        });
    });

    describe('checkHealthDetailed (protected)', () => {
        it('should return detailed health status with valid token', async () => {
            const mockDetailedResponse = {
                status: 'ok',
                timestamp: '2024-01-01T00:00:00.000Z',
                uptime: 12345,
                environment: 'development',
                message: 'Backend is running correctly',
            };

            jest.spyOn(service, 'getDetailedHealthStatus').mockReturnValue(mockDetailedResponse as any);

            process.env.HEALTH_TOKEN = 'secret-token';

            const result = await controller.checkHealthDetailed('secret-token');

            expect(result).toEqual(mockDetailedResponse);
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('environment');
        });

        it('should reject request without token', async () => {
            process.env.HEALTH_TOKEN = 'secret-token';

            await expect(controller.checkHealthDetailed(undefined)).rejects.toThrow(
                new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
            );
        });

        it('should reject request with invalid token', async () => {
            process.env.HEALTH_TOKEN = 'secret-token';

            await expect(controller.checkHealthDetailed('wrong-token')).rejects.toThrow(
                new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
            );
        });

        it('should reject if HEALTH_TOKEN is not set', async () => {
            delete process.env.HEALTH_TOKEN;

            await expect(controller.checkHealthDetailed('any-token')).rejects.toThrow(
                new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
            );
        });
    });
});
