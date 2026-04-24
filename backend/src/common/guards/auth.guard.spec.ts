import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthGuard } from './auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { SessionData } from '../types/session.types';

describe('AuthGuard', () => {
    let guard: AuthGuard;

    beforeEach(() => {
        guard = new AuthGuard();
    });

    const createMockContext = (session: Partial<SessionData>) => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    session,
                }),
            }),
        } as any;
    };

    describe('canActivate', () => {
        it('deberia retornar true si el usuario esta autenticado', async () => {
            const session = { userId: 'user-123' };
            const context = createMockContext(session);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('deberia lanzar UnauthorizedException si no hay userId en sesion', async () => {
            const session = {};
            const context = createMockContext(session);

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
            await expect(guard.canActivate(context)).rejects.toThrow('Not authenticated');
        });

        it('deberia lanzar UnauthorizedException si la sesion es undefined', async () => {
            const context = createMockContext(undefined as any);

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        });
    });
});
