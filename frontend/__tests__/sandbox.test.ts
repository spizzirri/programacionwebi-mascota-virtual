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

function mockSandboxProblems() {
    return [
        {
            _id: 'p1',
            title: 'Suma dos números',
            description: 'Escribí una función que reciba dos números y devuelva su suma.',
            params: ['a', 'b'],
            testCases: [{ input: [1, 2], expected: 3, sample: true }],
            active: true,
        },
        {
            _id: 'p2',
            title: 'Doble de un número',
            description: 'Devuelve el doble del número recibido.',
            params: ['n'],
            testCases: [{ input: [5], expected: 10, sample: true }],
            active: true,
        }
    ];
}

describe('SandboxView', () => {
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

    it('debería cargar los problemas en el selector al iniciar', async () => {
        const problems = mockSandboxProblems();
        const problemsSpy = jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(problemsSpy).toHaveBeenCalledTimes(1);

        const options = document.querySelectorAll('#problem-selector option');
        expect(options.length).toBe(problems.length + 1);
        expect(options[1].textContent).toBe(problems[0].title);
        expect(options[2].textContent).toBe(problems[1].title);
    });

    it('debería mostrar la descripción del problema seleccionado', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const description = document.getElementById('problem-description');
        expect(description?.textContent).toBe(problems[0].description);
    });

    it('debería resaltar código y validar sintaxis correcta', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        codeEditor.value = 'function solve(a, b) { return a + b; }';
        codeEditor.dispatchEvent(new Event('input'));

        const syntaxStatus = document.getElementById('syntax-status');
        const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
        const highlightCode = document.querySelector('#editor-highlight code');

        expect(syntaxStatus?.textContent).toBe('✓ Sintaxis válida');
        expect(syntaxStatus?.classList.contains('valid')).toBe(true);
        expect(runBtn.disabled).toBe(false);
        expect(highlightCode?.innerHTML).toContain('<span class="keyword">function</span>');
        expect(highlightCode?.innerHTML).toContain('<span class="keyword">return</span>');
    });

    it('debería resaltar strings y comentarios sin romper el HTML', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        codeEditor.value = [
            "function solve(a, b) {",
            "  // returns the class name",
            "  let msg = 'hello class';",
            "  return a + b;",
            "}"
        ].join('\n');
        codeEditor.dispatchEvent(new Event('input'));

        const highlightCode = document.querySelector('#editor-highlight code') as HTMLElement;
        const html = highlightCode.innerHTML;

        expect(html).toContain('<span class="comment">// returns the class name</span>');
        expect(html).toContain('<span class="string">\'hello class\'</span>');
        expect(html).not.toContain('class=class');
        expect(html).not.toContain('<span class="keyword">class</span>');
        expect(html).not.toContain('<span class="string">class=</span>');

        const textContent = highlightCode.textContent || '';
        expect(textContent).toContain('// returns the class name');
        expect(textContent).toContain("'hello class'");
    });

    it('debería agregar un <br> final cuando el código termina en salto de línea', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        const highlightCode = document.querySelector('#editor-highlight code') as HTMLElement;

        codeEditor.value = 'linea1\n';
        codeEditor.dispatchEvent(new Event('input'));
        expect(highlightCode.innerHTML).toMatch(/<br>$/);

        codeEditor.value = 'linea1';
        codeEditor.dispatchEvent(new Event('input'));
        expect(highlightCode.innerHTML).not.toMatch(/<br>$/);
    });

    it('debería mostrar error de sintaxis para código inválido', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        codeEditor.value = 'function solve(a, b) { return a + ';
        codeEditor.dispatchEvent(new Event('input'));

        const syntaxStatus = document.getElementById('syntax-status');
        const runBtn = document.getElementById('run-btn') as HTMLButtonElement;

        expect(syntaxStatus?.textContent).toContain('✗');
        expect(syntaxStatus?.classList.contains('invalid')).toBe(true);
        expect(runBtn.disabled).toBe(true);
    });

    it('debería insertar dos espacios al presionar Tab', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        codeEditor.value = 'line';
        codeEditor.selectionStart = 0;
        codeEditor.selectionEnd = 0;

        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        codeEditor.dispatchEvent(tabEvent);

        expect(codeEditor.value).toBe('  line');
        expect(codeEditor.selectionStart).toBe(2);
        expect(codeEditor.selectionEnd).toBe(2);
    });

    it('debería sincronizar el scroll del resaltado con el textarea', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        const editorHighlight = document.getElementById('editor-highlight') as HTMLElement;

        codeEditor.scrollTop = 50;
        codeEditor.scrollLeft = 10;
        codeEditor.dispatchEvent(new Event('scroll'));

        expect(editorHighlight.scrollTop).toBe(50);
        expect(editorHighlight.scrollLeft).toBe(10);
    });

    it('debería ejecutar el código y mostrar resultados exitosos', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        const runResponse = {
            results: [{ input: [1, 2], expected: 3, actual: 3, passed: true, hidden: false }],
            allPassed: true,
            error: null
        };
        const runSpy = jest.spyOn(apiModule.api, 'runSandboxCode').mockResolvedValue(runResponse as any);

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

        const resultsContainer = document.getElementById('results-container');
        const resultsBanner = document.getElementById('results-banner');
        const resultsBody = document.getElementById('results-body');

        expect(resultsContainer?.classList.contains('hidden')).toBe(false);
        expect(resultsBanner?.textContent).toContain('Todos los tests pasaron');
        expect(resultsBanner?.classList.contains('all-passed')).toBe(true);
        expect(resultsBody?.textContent).toContain('✓');
    });

    it('debería ejecutar el código y mostrar resultados fallidos', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        const runResponse = {
            results: [{ input: [1, 2], expected: 3, actual: 5, passed: false, hidden: false }],
            allPassed: false,
            error: null
        };
        const runSpy = jest.spyOn(apiModule.api, 'runSandboxCode').mockResolvedValue(runResponse as any);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        codeEditor.value = 'function solve(a, b) { return a + b + 2; }';
        codeEditor.dispatchEvent(new Event('input'));

        const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
        runBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(runSpy).toHaveBeenCalledWith('p1', codeEditor.value);

        const resultsBanner = document.getElementById('results-banner');
        const resultsBody = document.getElementById('results-body');

        expect(resultsBanner?.textContent).toContain('Fallaron 1 tests');
        expect(resultsBanner?.classList.contains('some-failed')).toBe(true);
        expect(resultsBody?.textContent).toContain('✗');
    });

    it('debería mostrar error de ejecución cuando la API devuelve error', async () => {
        const problems = mockSandboxProblems();
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockResolvedValue(problems);

        const runResponse = {
            results: [],
            allPassed: false,
            error: 'ReferenceError: x is not defined'
        };
        const runSpy = jest.spyOn(apiModule.api, 'runSandboxCode').mockResolvedValue(runResponse);

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const selector = document.getElementById('problem-selector') as HTMLSelectElement;
        selector.value = 'p1';
        selector.dispatchEvent(new Event('change'));

        const codeEditor = document.getElementById('code-editor') as HTMLTextAreaElement;
        codeEditor.value = 'function solve(a, b) { return x + b; }';
        codeEditor.dispatchEvent(new Event('input'));

        const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
        runBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(runSpy).toHaveBeenCalledWith('p1', codeEditor.value);

        const resultsBanner = document.getElementById('results-banner');
        const resultsBody = document.getElementById('results-body');

        expect(resultsBanner?.textContent).toContain('Error: ReferenceError: x is not defined');
        expect(resultsBanner?.classList.contains('error')).toBe(true);
        expect(resultsBody?.innerHTML).toBe('');
    });

    it('debería manejar error al cargar problemas', async () => {
        jest.spyOn(apiModule.api, 'getSandboxProblems').mockRejectedValue(new Error('Network error'));

        new SandboxView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const alertContainer = document.querySelector('.alert-modal-container');
        expect(alertContainer).toBeTruthy();
        expect(alertContainer?.textContent).toContain('Error al cargar problemas');
    });
});

describe('Sandbox CSS', () => {
    function leerCSS(): string {
        const cssPath = path.resolve(__dirname, '../src/styles/sandbox.css');
        return fs.readFileSync(cssPath, 'utf-8');
    }

    it('debería reservar el mismo espacio de scrollbar que el textarea', () => {
        const css = leerCSS();
        expect(css).toMatch(/\.editor-highlight\s*\{[^}]*overflow-y:\s*scroll/s);
        expect(css).toMatch(/\.editor-highlight\s*\{[^}]*overflow-x:\s*hidden/s);
    });

    it('debería renderizar el código resaltado como bloque con la misma fuente', () => {
        const css = leerCSS();
        expect(css).toMatch(/\.editor-highlight\s+code\s*\{[^}]*display:\s*block/s);
        expect(css).toMatch(/\.editor-highlight\s+code\s*\{[^}]*font-family:\s*inherit/s);
    });

    it('no debería agregar padding inferior extra al código resaltado', () => {
        const css = leerCSS();
        const match = css.match(/\.editor-highlight\s+code\s*\{[^}]*\}/s);
        if (match) {
            expect(match[0]).not.toMatch(/padding-bottom/);
        }
    });
});
