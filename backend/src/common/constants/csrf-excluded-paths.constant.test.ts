import { describe, it, expect } from '@jest/globals';
import { CSRF_EXCLUDED_PATHS } from './csrf-excluded-paths.constant';

describe('CSRF Excluded Paths Constant', () => {
    it('deberia contener /auth/login', () => {
        expect(CSRF_EXCLUDED_PATHS).toContain('/auth/login');
    });

    it('deberia contener /users', () => {
        expect(CSRF_EXCLUDED_PATHS).toContain('/users');
    });

    it('deberia tener exactamente 2 rutas', () => {
        expect(CSRF_EXCLUDED_PATHS.length).toBe(2);
    });
});
