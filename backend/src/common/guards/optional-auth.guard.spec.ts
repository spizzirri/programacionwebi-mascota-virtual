import { describe, it, expect, beforeEach } from '@jest/globals';
import { OptionalAuthGuard } from './optional-auth.guard';

describe('OptionalAuthGuard', () => {
    let guard: OptionalAuthGuard;

    beforeEach(() => {
        guard = new OptionalAuthGuard();
    });

    describe('canActivate', () => {
        it('deberia siempre retornar true', async () => {
            const mockContext = {} as any;

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });
    });

    describe('getRequest', () => {
        it('deberia retornar el request del context', () => {
            const mockRequest = { user: 'test' };
            const mockContext = {
                switchToHttp: () => ({
                    getRequest: () => mockRequest,
                }),
            } as any;

            const result = guard.getRequest(mockContext);

            expect(result).toBe(mockRequest);
        });
    });
});
