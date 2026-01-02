/** @type {import('jest').Config} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/vite-env.d.ts',
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
            tsconfig: {
                module: 'esnext',
                moduleResolution: 'node',
            },
        }],
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    setupFiles: ['<rootDir>/jest.setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
