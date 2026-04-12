import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getPublicHealthStatus() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    getDetailedHealthStatus() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            message: 'Backend is running correctly',
        };
    }
}
