import { describe, it, expect } from '@jest/globals';
import {
    MAX_LOGIN_ATTEMPTS,
    LOCK_DURATION_MINUTES,
    SESSION_TTL_SECONDS,
    SESSION_COOKIE_MAX_AGE_MS,
    DEFAULT_THROTTLE_TTL_MS,
    DEFAULT_THROTTLE_LIMIT,
    E2E_THROTTLE_LIMIT,
} from './auth.constants';

describe('Auth Constants', () => {
    describe('MAX_LOGIN_ATTEMPTS', () => {
        it('deberia ser 3', () => {
            expect(MAX_LOGIN_ATTEMPTS).toBe(3);
        });
    });

    describe('LOCK_DURATION_MINUTES', () => {
        it('deberia ser 15 minutos', () => {
            expect(LOCK_DURATION_MINUTES).toBe(15);
        });
    });

    describe('SESSION_TTL_SECONDS', () => {
        it('deberia ser 24 horas en segundos', () => {
            expect(SESSION_TTL_SECONDS).toBe(24 * 60 * 60);
        });
    });

    describe('SESSION_COOKIE_MAX_AGE_MS', () => {
        it('deberia ser 15 horas en milisegundos', () => {
            expect(SESSION_COOKIE_MAX_AGE_MS).toBe(15 * 60 * 60 * 1000);
        });
    });

    describe('DEFAULT_THROTTLE_TTL_MS', () => {
        it('deberia ser 60000 ms (1 minuto)', () => {
            expect(DEFAULT_THROTTLE_TTL_MS).toBe(60000);
        });
    });

    describe('DEFAULT_THROTTLE_LIMIT', () => {
        it('deberia ser 100 requests', () => {
            expect(DEFAULT_THROTTLE_LIMIT).toBe(100);
        });
    });

    describe('E2E_THROTTLE_LIMIT', () => {
        it('deberia ser 10000 requests para e2e', () => {
            expect(E2E_THROTTLE_LIMIT).toBe(10000);
        });
    });
});
