import { describe, it, expect } from '@jest/globals';
import { truncate, formatDate, formatDateShort } from '../src/utils';

describe('truncate', () => {
    it('deberia devolver el texto original si no excede el limite', () => {
        expect(truncate('hola', 10)).toBe('hola');
    });

    it('deberia truncar y agregar ... cuando excede el limite', () => {
        expect(truncate('hello world', 5)).toBe('hello...');
    });

    it('deberia devolver cadena vacia si el texto esta vacio', () => {
        expect(truncate('', 5)).toBe('');
    });

    it('deberia devolver ... si el limite es 0', () => {
        expect(truncate('abc', 0)).toBe('...');
    });

    it('deberia manejar limite igual a la longitud del texto', () => {
        expect(truncate('abcd', 4)).toBe('abcd');
    });

    it('deberia manejar limite mayor a la longitud del texto', () => {
        expect(truncate('abc', 10)).toBe('abc');
    });
});

describe('formatDate', () => {
    const now = new Date();

    it('deberia devolver "Hace un momento" para fechas recientes (< 1 min)', () => {
        const date = new Date(now.getTime() - 30000).toISOString();
        expect(formatDate(date)).toBe('Hace un momento');
    });

    it('deberia devolver "Hace X min" para minutos', () => {
        const date = new Date(now.getTime() - 5 * 60000).toISOString();
        expect(formatDate(date)).toBe('Hace 5 min');
    });

    it('deberia devolver "Hace Xh" para horas', () => {
        const date = new Date(now.getTime() - 3 * 3600000).toISOString();
        expect(formatDate(date)).toBe('Hace 3h');
    });

    it('deberia devolver "Hace Xd" para dias', () => {
        const date = new Date(now.getTime() - 4 * 86400000).toISOString();
        expect(formatDate(date)).toBe('Hace 4d');
    });

    it('deberia devolver fecha localizada para > 7 dias', () => {
        const date = new Date(now.getTime() - 10 * 86400000);
        const expected = date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
        });
        expect(formatDate(date.toISOString())).toBe(expected);
    });

    it('deberia incluir el año si es distinto al actual', () => {
        const date = new Date(now.getFullYear() - 1, 0, 15);
        const expected = date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
        expect(formatDate(date.toISOString())).toBe(expected);
    });
});

describe('formatDateShort', () => {
    it('deberia devolver fecha formateada corta', () => {
        const date = new Date(2024, 0, 15, 14, 30);
        const expected = date.toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
        expect(formatDateShort(date.toISOString())).toBe(expected);
    });
});
