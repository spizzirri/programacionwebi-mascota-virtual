import { Problem } from '../database/schemas/problem.schema';

export const problemSeeds: Problem[] = [
    {
        title: 'Suma de tres números',
        description: 'Escribe una función solve(x, y, z) que retorne la suma de los tres números.',
        params: ['x', 'y', 'z'],
        testCases: [
            { input: [1, 2, 3], expected: 6, sample: true },
            { input: [-5, 10, 0], expected: 5, sample: true },
            { input: [100, -50, 25], expected: 75, sample: false },
        ],
        active: true,
    } as Problem,
    {
        title: '¿Es par?',
        description: 'Escribe una función solve(n) que retorne true si n es par, false si es impar.',
        params: ['n'],
        testCases: [
            { input: [4], expected: true, sample: true },
            { input: [7], expected: false, sample: true },
            { input: [0], expected: true, sample: false },
        ],
        active: true,
    } as Problem,
];