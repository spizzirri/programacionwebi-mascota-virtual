import '@testing-library/jest-dom';
import { jest, beforeEach } from '@jest/globals';

global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
} as unknown as Partial<Response>)) as any;

global.dispatchEvent = jest.fn() as any;

beforeEach(() => {
    jest.clearAllMocks();
});
