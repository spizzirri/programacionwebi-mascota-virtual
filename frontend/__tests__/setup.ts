// Jest setup file - runs AFTER test framework is installed
import '@testing-library/jest-dom';
import { jest, beforeEach } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn() as any;

// Mock window.dispatchEvent
global.dispatchEvent = jest.fn() as any;

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
