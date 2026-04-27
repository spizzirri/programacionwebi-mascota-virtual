import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../../database/database.service';
import type { SessionData } from '../types/session.types';
import { PROFESSOR_ROLE } from '../constants/roles.constants';

@Injectable()
export class ProfessorGuard implements CanActivate {
    constructor(private readonly databaseService: DatabaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const session = request.session as SessionData;
        const apiKey = request.headers['x-api-key'] as string;

        if (apiKey && process.env.API_KEY && apiKey === process.env.API_KEY) {
            return true;
        }

        if (!session?.userId) {
            throw new ForbiddenException('Forbidden: Invalid session or API Key');
        }

        const user = await this.databaseService.findUserById(session.userId);
        if (!user || user.role !== PROFESSOR_ROLE) {
            throw new ForbiddenException('Forbidden: Only professors can access this resource');
        }

        return true;
    }
}
