import { describe, it, expect } from '@jest/globals';
import { ActiveTopicFilter } from './active-topic-filter';

describe('ActiveTopicFilter', () => {
    it('deberia retornar solo topicos habilitados', () => {
        const filter = new ActiveTopicFilter([
            { name: 'html', enabled: true },
            { name: 'css', enabled: false }
        ]);
        expect(filter.getActiveNames()).toEqual(['html']);
    });

    it('deberia excluir topicos con startDate futuro', () => {
        const future = new Date();
        future.setDate(future.getDate() + 10);

        const filter = new ActiveTopicFilter([
            { name: 'html', enabled: true },
            { name: 'css', enabled: true, startDate: future }
        ]);
        expect(filter.getActiveNames()).toEqual(['html']);
    });

    it('deberia excluir topicos con endDate pasado', () => {
        const past = new Date();
        past.setDate(past.getDate() - 10);

        const filter = new ActiveTopicFilter([
            { name: 'html', enabled: true, endDate: past },
            { name: 'css', enabled: true }
        ]);
        expect(filter.getActiveNames()).toEqual(['css']);
    });

    it('deberia incluir topicos dentro de rango de fechas', () => {
        const past = new Date();
        past.setDate(past.getDate() - 5);
        const future = new Date();
        future.setDate(future.getDate() + 5);

        const filter = new ActiveTopicFilter([
            { name: 'html', enabled: true, startDate: past, endDate: future }
        ]);
        expect(filter.getActiveNames()).toEqual(['html']);
    });

    it('deberia retornar lista vacia si todos los topicos estan deshabilitados', () => {
        const filter = new ActiveTopicFilter([
            { name: 'html', enabled: false },
            { name: 'css', enabled: false }
        ]);
        expect(filter.getActiveNames()).toEqual([]);
    });

    it('deberia retornar lista vacia si no hay topicos', () => {
        const filter = new ActiveTopicFilter([]);
        expect(filter.getActiveNames()).toEqual([]);
    });
});
