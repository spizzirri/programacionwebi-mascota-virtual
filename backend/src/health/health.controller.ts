import { Controller, Get, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';


@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    async checkHealth() {
        return this.healthService.getPublicHealthStatus();
    }

    @Get('detailed')
    async checkHealthDetailed(@Headers('x-health-token') healthToken?: string) {
        const expectedToken = process.env.HEALTH_TOKEN;

        if (!expectedToken || healthToken !== expectedToken) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        return this.healthService.getDetailedHealthStatus();
    }
}
