import { describe, it, expect } from '@jest/globals';
import { STUDENT_ROLE, PROFESSOR_ROLE, VALID_ROLES } from './roles.constants';

describe('Roles Constants', () => {
    describe('STUDENT_ROLE', () => {
        it('deberia ser STUDENT', () => {
            expect(STUDENT_ROLE).toBe('STUDENT');
        });
    });

    describe('PROFESSOR_ROLE', () => {
        it('deberia ser PROFESSOR', () => {
            expect(PROFESSOR_ROLE).toBe('PROFESSOR');
        });
    });

    describe('VALID_ROLES', () => {
        it('deberia contener STUDENT y PROFESSOR', () => {
            expect(VALID_ROLES).toContain('STUDENT');
            expect(VALID_ROLES).toContain('PROFESSOR');
        });

        it('deberia tener exactamente 2 roles', () => {
            expect(VALID_ROLES.length).toBe(2);
        });
    });
});
