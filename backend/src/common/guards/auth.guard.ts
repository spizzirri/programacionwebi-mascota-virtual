import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import type { SessionData } from '../types/session.types';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const session = request.session as SessionData;

        if (!session?.userId) {
            throw new UnauthorizedException('Not authenticated');
        }

        return true;
    }
}
