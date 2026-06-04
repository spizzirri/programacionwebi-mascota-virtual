export interface Problem {
  id: number;
  title: string;
  description: string;
  params: string[];
  testCases: { input: number[]; expected: any }[];
}

export const problems: Problem[] = [
  {
    id: 1,
    title: 'Suma de tres números',
    description: 'Escribe una función solve(x, y, z) que retorne la suma de los tres números.',
    params: ['x', 'y', 'z'],
    testCases: [
      { input: [1, 2, 3], expected: 6 },
      { input: [-5, 10, 0], expected: 5 },
      { input: [100, -50, 25], expected: 75 },
    ],
  },
  {
    id: 2,
    title: '¿Es par?',
    description: 'Escribe una función solve(n) que retorne true si n es par, false si es impar.',
    params: ['n'],
    testCases: [
      { input: [4], expected: true },
      { input: [7], expected: false },
      { input: [0], expected: true },
    ],
  },
];
