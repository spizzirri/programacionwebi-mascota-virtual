import { describe, it, expect } from '@jest/globals';
import { paginate } from './pagination.types';

describe('Pagination', () => {
    describe('paginate helper', () => {
        it('deberia retornar metadata correcta con datos', () => {
            const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const total = 10;
            const page = 1;
            const limit = 3;

            const result = paginate(data, total, page, limit);

            expect(result.data).toEqual(data);
            expect(result.meta).toEqual({
                page: 1,
                limit: 3,
                total: 10,
                totalPages: 4,
                hasNextPage: true,
                hasPrevPage: false,
            });
        });

        it('deberia calcular correctamente hasPrevPage en pagina > 1', () => {
            const data = [{ id: 4 }, { id: 5 }];
            const total = 10;
            const page = 2;
            const limit = 5;

            const result = paginate(data, total, page, limit);

            expect(result.meta.hasPrevPage).toBe(true);
            expect(result.meta.hasNextPage).toBe(false);
            expect(result.meta.totalPages).toBe(2);
        });

        it('deberia manejar lista vacia', () => {
            const result = paginate([], 0, 1, 10);

            expect(result.data).toEqual([]);
            expect(result.meta.total).toBe(0);
            expect(result.meta.totalPages).toBe(0);
            expect(result.meta.hasNextPage).toBe(false);
            expect(result.meta.hasPrevPage).toBe(false);
        });

        it('deberia manejar ultima pagina correctamente', () => {
            const data = [{ id: 9 }, { id: 10 }];
            const result = paginate(data, 10, 2, 5);

            expect(result.meta.hasNextPage).toBe(false);
            expect(result.meta.hasPrevPage).toBe(true);
        });
    });
});
