import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        return true;
    }

    getRequest(context: ExecutionContext): Request {
        return context.switchToHttp().getRequest<Request>();
    }
}
