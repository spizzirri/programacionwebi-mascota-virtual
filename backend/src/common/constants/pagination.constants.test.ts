import { describe, it, expect } from '@jest/globals';
import {
    DEFAULT_PAGINATION_PAGE,
    DEFAULT_PAGINATION_LIMIT,
    MAX_PAGINATION_LIMIT,
    MIN_PAGINATION_LIMIT,
} from './pagination.constants';

describe('Pagination Constants', () => {
    describe('DEFAULT_PAGINATION_PAGE', () => {
        it('deberia ser 1', () => {
            expect(DEFAULT_PAGINATION_PAGE).toBe(1);
        });
    });

    describe('DEFAULT_PAGINATION_LIMIT', () => {
        it('deberia ser 20', () => {
            expect(DEFAULT_PAGINATION_LIMIT).toBe(20);
        });
    });

    describe('MAX_PAGINATION_LIMIT', () => {
        it('deberia ser 100', () => {
            expect(MAX_PAGINATION_LIMIT).toBe(100);
        });
    });

    describe('MIN_PAGINATION_LIMIT', () => {
        it('deberia ser 1', () => {
            expect(MIN_PAGINATION_LIMIT).toBe(1);
        });
    });
});
