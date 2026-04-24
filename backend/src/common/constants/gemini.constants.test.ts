import { describe, it, expect } from '@jest/globals';
import {
    GEMINI_SYSTEM_INSTRUCTION,
    GEMINI_MODEL,
    GEMINI_RESPONSE_MIME_TYPE,
    FEEDBACK_MAX_LENGTH,
} from './gemini.constants';

describe('Gemini Constants', () => {
    describe('GEMINI_SYSTEM_INSTRUCTION', () => {
        it('deberia contener criterios de evaluacion', () => {
            expect(GEMINI_SYSTEM_INSTRUCTION).toContain('correct');
            expect(GEMINI_SYSTEM_INSTRUCTION).toContain('partial');
            expect(GEMINI_SYSTEM_INSTRUCTION).toContain('incorrect');
        });

        it('deberia contener instrucciones de seguridad', () => {
            expect(GEMINI_SYSTEM_INSTRUCTION).toContain('INSTRUCCIONES DE SEGURIDAD');
        });

        it('deberia ser un string no vacio', () => {
            expect(GEMINI_SYSTEM_INSTRUCTION.length).toBeGreaterThan(100);
        });
    });

    describe('GEMINI_MODEL', () => {
        it('deberia ser gemini-2.5-flash', () => {
            expect(GEMINI_MODEL).toBe('gemini-2.5-flash');
        });
    });

    describe('GEMINI_RESPONSE_MIME_TYPE', () => {
        it('deberia ser application/json', () => {
            expect(GEMINI_RESPONSE_MIME_TYPE).toBe('application/json');
        });
    });

    describe('FEEDBACK_MAX_LENGTH', () => {
        it('deberia ser 400 caracteres', () => {
            expect(FEEDBACK_MAX_LENGTH).toBe(400);
        });
    });
});
