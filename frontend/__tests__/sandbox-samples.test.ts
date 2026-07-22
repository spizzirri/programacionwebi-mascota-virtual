import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SandboxView } from '../src/views/sandbox';
import * as apiModule from '../src/api';
import { AppNavbar } from '../src/web-components';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function inicializarWebComponents() {
    new AppNavbar();
}

function cargarHTML() {
    const htmlPath = path.resolve(__dirname, '../src/views/sandbox.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    document.body.innerHTML = htmlContent;
}

function mockProblemsConSamplesYOcultos() {
    return [
        {
            _id: 'p1',
            title: 'Suma',
            description: 'Suma dos números',
            params: ['a', 'b'],
            testCases: [
                { input: [1, 2], expected: 3, sample: true },
                { input: [5, 5], expected: 10, sample: true },
                { input: [0, 0], expected: 0, sample: false },
                { input: [-1, -1], expected: -2, sample: false },
            ],
            active: true,
        },
    ];
}

describe('SandboxView - samples y ocultos', () => {
    beforeAll(() => {
        inicializarWebComponents();
    });

    beforeEach(() => {
        cargarHTML();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('deberia mostrar el enunciado cuando onProblemChange', async () => {
        const problems = mockProblemsConSamplesYOcultos();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const description = document.getElementById('problem-description');
        expect(description?.textContent).toBe('Suma dos números');
    });

    it('deberia mostrar tabla de entradas de ejemplo (sample) con input+expected cuando onProblemChange', async () => {
        const problems = mockProblemsConSamplesYOcultos();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const samplesTable = document.getElementById('samples-table');
        expect(samplesTable).toBeTruthy();
        const rows = samplesTable?.querySelectorAll('tbody tr') ?? [];
        expect(rows.length).toBe(2);
        expect(samplesTable?.textContent).toContain('1, 2');
        expect(samplesTable?.textContent).toContain('3');
        expect(samplesTable?.textContent).toContain('5, 5');
        expect(samplesTable?.textContent).toContain('10');
    });

    it('deberia mostrar contador de tests ocultos (sin valores) cuando onProblemChange tiene tests sample=false', async () => {
        const problems = mockProblemsConSamplesYOcultos();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const hiddenCounter = document.getElementById('hidden-tests-counter');
        expect(hiddenCounter).toBeTruthy();
        expect(hiddenCounter?.textContent).toContain('2');
        expect(hiddenCounter?.textContent?.toLowerCase()).toContain('oculto');
    });

    it('deberia ocultar contador y samples cuando no hay problema seleccionado', async () => {
        const problems = mockProblemsConSamplesYOcultos();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const samplesTable = document.getElementById('samples-table');
        const hiddenCounter = document.getElementById('hidden-tests-counter');
        expect(samplesTable?.classList.contains('hidden')).toBe(true);
        expect(hiddenCounter?.classList.contains('hidden')).toBe(true);
    });

    it('deberia marcar filas de tests no-sample como [oculto] en el resultado cuando handleRun', async () => {
        const problems = mockProblemsConSamplesYOcultos();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);
        const runResponse = {
            results: [
                { input: [1, 2], expected: 3, actual: 3, passed: true, hidden: false },
                { input: [5, 5], expected: 10, actual: 10, passed: true, hidden: false },
                { input: '[oculto]', expected: '[oculto]', actual: -1, passed: false, hidden: true },
                { input: '[oculto]', expected: '[oculto]', actual: -2, passed: false, hidden: true },
            ],
            allPassed: false,
            error: null,
        };
        const runSpy = jest.spyOn(apiModule.api, 'runSandboxCode').mockResolvedValue(runResponse);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        codeEditor.value = 'function solve(a, b) { return a + b; }';
        codeEditor.dispatchEvent(new Event('input'));

        const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
        runBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(runSpy).toHaveBeenCalledWith('p1', codeEditor.value);

        const resultsBody = document.getElementById('results-body');
        const text = resultsBody?.textContent ?? '';
        expect(text).toContain('[oculto]');
    });
});