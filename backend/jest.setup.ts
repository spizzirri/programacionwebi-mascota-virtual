// This file runs BEFORE the test framework is installed
// Used to mock import.meta before any modules are loaded

import 'reflect-metadata';

process.env.GEMINI_API_KEY = 'GEMINI_API_KEY';