import '@testing-library/jest-dom';
import { jest, beforeEach } from '@jest/globals';

global.fetch = jest.fn() as any;

global.dispatchEvent = jest.fn() as any;

beforeEach(() => {
    jest.clearAllMocks();
});
