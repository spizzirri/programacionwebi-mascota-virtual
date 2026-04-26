import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ProfessorGuard } from './professor.guard';
import { ForbiddenException } from '@nestjs/common';
import { SessionData } from '../types/session.types';
import { DatabaseService } from '../../database/database.service';

describe('ProfessorGuard', () => {
    let guard: ProfessorGuard;
    let mockDatabaseService: { findUserById: jest.Mock };

    beforeEach(() => {
        mockDatabaseService = {
            findUserById: jest.fn(),
        };
        guard = new ProfessorGuard(mockDatabaseService as any) as any;
    });

    const createMockContext = (session: Partial<SessionData>, apiKey?: string) => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    session,
                    headers: {
                        'x-api-key': apiKey,
                    },
                }),
            }),
        } as any;
    };

    describe('canActivate', () => {
        const originalApiKey = process.env.API_KEY;

        afterEach(() => {
            process.env.API_KEY = originalApiKey;
        });

        it('deberia retornar true si el API key es valido', async () => {
            process.env.API_KEY = 'test-key';
            const context = createMockContext({}, 'test-key');

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockDatabaseService.findUserById).not.toHaveBeenCalled();
        });

        it('deberia retornar true si el usuario es PROFESSOR', async () => {
            // @ts-ignore - Mock for testing
            mockDatabaseService.findUserById.mockResolvedValue({ role: 'PROFESSOR' } as any) as any;
            const context = createMockContext({ userId: 'user-123' });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockDatabaseService.findUserById).toHaveBeenCalledWith('user-123');
        });

        it('deberia lanzar ForbiddenException si no hay userId ni API key', async () => {
            const context = createMockContext({});

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Forbidden: Invalid session or API Key');
        });

        it('deberia lanzar ForbiddenException si el usuario no es PROFESSOR', async () => {
            // @ts-ignore - Mock for testing
            mockDatabaseService.findUserById.mockResolvedValue({ role: 'STUDENT' } as any) as any;
            const context = createMockContext({ userId: 'user-123' });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Forbidden: Only professors can access this resource');
        });

        it('deberia lanzar ForbiddenException si el usuario no existe', async () => {
            // @ts-ignore - Mock for testing
            mockDatabaseService.findUserById.mockResolvedValue(null as any);
            const context = createMockContext({ userId: 'user-123' });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        });

        it('deberia retornar false si el API key no coincide', async () => {
            process.env.API_KEY = 'test-key';
            // @ts-ignore - Mock for testing
            mockDatabaseService.findUserById.mockResolvedValue({ role: 'STUDENT' } as any) as any;
            const context = createMockContext({ userId: 'user-123' }, 'wrong-key');

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        });
    });
});
