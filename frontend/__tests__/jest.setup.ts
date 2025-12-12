// This file runs BEFORE the test framework is installed
// Used to mock import.meta before any modules are loaded

import { TextEncoder, TextDecoder } from 'util';

// Polyfills for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

Object.defineProperty(globalThis, 'import', {
    value: {
        meta: {
            env: {
                VITE_API_BASE_URL: 'http://localhost:3000',
            },
        },
    },
    writable: true,
    configurable: true,
});
