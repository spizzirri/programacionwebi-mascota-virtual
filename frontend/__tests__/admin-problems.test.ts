import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { AdminProblemsView } from '../src/views/admin-problems';
import * as apiModule from '../src/api';
import { AppNavbar } from '../src/web-components';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function inicializarWebComponents() {
    new AppNavbar();
}

function cargarHTML() {
    const htmlPath = path.resolve(__dirname, '../src/views/admin-problems.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    document.body.innerHTML = htmlContent;
}

function mockProblem(overrides: Partial<apiModule.Problem> = {}): apiModule.Problem {
    return {
        _id: 'p1',
        title: 'Suma',
        description: 'Suma dos',
        params: ['a', 'b'],
        testCases: [
            { input: [1, 2], expected: 3, sample: true },
            { input: [0, 0], expected: 0, sample: false },
        ],
        active: true,
        ...overrides,
    };
}

describe('AdminProblemsView', () => {
    beforeAll(() => {
        inicializarWebComponents();
    });

    beforeEach(() => {
        cargarHTML();
        jest.clearAllMocks();
        jest.spyOn(apiModule.api, 'getSandboxProblemsAdmin').mockResolvedValue({ problems: [] });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('deberia cargar y renderizar problemas al iniciar', async () => {
        const problems = [mockProblem({ title: 'A' }), mockProblem({ _id: 'p2', title: 'B' })];
        jest.spyOn(apiModule.api, 'getSandboxProblemsAdmin').mockResolvedValue({ problems });

        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        const tableBody = document.getElementById('problems-table-body');
        expect(tableBody?.textContent).toContain('A');
        expect(tableBody?.textContent).toContain('B');
    });

    it('deberia abrir el modal vacio cuando se clickea Agregar', async () => {
        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        const modal = document.getElementById('problem-modal');
        expect(modal?.classList.contains('hidden')).toBe(true);

        document.getElementById('add-problem-btn')?.click();

        expect(modal?.classList.contains('hidden')).toBe(false);
        const titleInput = document.getElementById('problem-title') as HTMLInputElement;
        expect(titleInput.value).toBe('');
    });

    it('deberia abrir el modal con datos cargados cuando se clickea editar', async () => {
        const problems = [mockProblem({ title: 'Editar-me' })];
        jest.spyOn(apiModule.api, 'getSandboxProblemsAdmin').mockResolvedValue({ problems });

        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        const editBtn = document.querySelector('.edit-problem-btn') as HTMLButtonElement;
        editBtn?.click();

        const modal = document.getElementById('problem-modal');
        expect(modal?.classList.contains('hidden')).toBe(false);
        const titleInput = document.getElementById('problem-title') as HTMLInputElement;
        expect(titleInput.value).toBe('Editar-me');
        const descInput = document.getElementById('problem-description') as HTMLTextAreaElement;
        expect(descInput.value).toBe('Suma dos');
    });

    it('deberia agregar un campo de parametro dinamico cuando addParam', async () => {
        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        const before = document.querySelectorAll('.param-input').length;
        document.getElementById('add-param-btn')?.click();
        const after = document.querySelectorAll('.param-input').length;
        expect(after).toBe(before + 1);
    });

    it('deberia agregar un testCase dinamico (input JSON, expected JSON, sample checkbox) cuando addTestCase', async () => {
        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        const before = document.querySelectorAll('.test-case-row').length;
        document.getElementById('add-test-case-btn')?.click();
        const after = document.querySelectorAll('.test-case-row').length;
        expect(after).toBe(before + 1);

        const lastRow = document.querySelectorAll('.test-case-row')[after - 1] as HTMLElement;
        expect(lastRow.querySelector('.test-input')).toBeTruthy();
        expect(lastRow.querySelector('.test-expected')).toBeTruthy();
        expect(lastRow.querySelector('.test-sample')).toBeTruthy();
    });

    it('deberia validar JSON de input/expected y mostrar error cuando JSON es invalido', async () => {
        const createSpy = jest.spyOn(apiModule.api, 'createSandboxProblem');
        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        document.getElementById('add-problem-btn')?.click();
        const titleInput = document.getElementById('problem-title') as HTMLInputElement;
        titleInput.value = 'T';
        const descInput = document.getElementById('problem-description') as HTMLTextAreaElement;
        descInput.value = 'D';

        document.getElementById('add-test-case-btn')?.click();
        const rows = document.querySelectorAll('.test-case-row');
        const lastRow = rows[rows.length - 1] as HTMLElement;
        const inputEl = lastRow.querySelector('.test-input') as HTMLTextAreaElement;
        inputEl.value = 'not-json';
        const expectedEl = lastRow.querySelector('.test-expected') as HTMLTextAreaElement;
        expectedEl.value = '1';

        document.getElementById('save-problem-btn')?.click();
        await new Promise(r => setTimeout(r, 0));

        expect(createSpy).not.toHaveBeenCalled();
        const errorArea = document.getElementById('problem-form-error');
        expect(errorArea?.textContent).toBeTruthy();
    });

    it('deberia llamar createSandboxProblem cuando submit del modal crear', async () => {
        const createSpy = jest.spyOn(apiModule.api, 'createSandboxProblem').mockResolvedValue({ problem: mockProblem() });
        jest.spyOn(apiModule.api, 'getSandboxProblemsAdmin').mockResolvedValue({ problems: [] });
        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        document.getElementById('add-problem-btn')?.click();
        const titleInput = document.getElementById('problem-title') as HTMLInputElement;
        titleInput.value = 'Nuevo';
        const descInput = document.getElementById('problem-description') as HTMLTextAreaElement;
        descInput.value = 'Desc';

        document.getElementById('add-param-btn')?.click();
        const paramInputs = document.querySelectorAll('.param-input');
        (paramInputs[paramInputs.length - 1] as HTMLInputElement).value = 'x';

        document.getElementById('add-test-case-btn')?.click();
        const rows = document.querySelectorAll('.test-case-row');
        const lastRow = rows[rows.length - 1] as HTMLElement;
        (lastRow.querySelector('.test-input') as HTMLTextAreaElement).value = '[1, 2]';
        (lastRow.querySelector('.test-expected') as HTMLTextAreaElement).value = '3';
        (lastRow.querySelector('.test-sample') as HTMLInputElement).checked = true;

        document.getElementById('save-problem-btn')?.click();
        await new Promise(r => setTimeout(r, 0));

        expect(createSpy).toHaveBeenCalledTimes(1);
        const arg = createSpy.mock.calls[0][0];
        expect(arg.title).toBe('Nuevo');
        expect(arg.testCases[0].input).toEqual([1, 2]);
        expect(arg.testCases[0].expected).toBe(3);
        expect(arg.testCases[0].sample).toBe(true);
    });

    it('deberia llamar updateSandboxProblem cuando submit del modal editar', async () => {
        const problems = [mockProblem({ title: 'A' })];
        jest.spyOn(apiModule.api, 'getSandboxProblemsAdmin').mockResolvedValue({ problems });
        const updateSpy = jest.spyOn(apiModule.api, 'updateSandboxProblem').mockResolvedValue({ problem: mockProblem() });

        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        document.querySelector('.edit-problem-btn')?.dispatchEvent(new Event('click'));
        const titleInput = document.getElementById('problem-title') as HTMLInputElement;
        titleInput.value = 'Actualizado';
        document.getElementById('save-problem-btn')?.click();
        await new Promise(r => setTimeout(r, 0));

        expect(updateSpy).toHaveBeenCalledTimes(1);
        const [idArg, bodyArg] = updateSpy.mock.calls[0];
        expect(idArg).toBe('p1');
        expect(bodyArg.title).toBe('Actualizado');
    });

    it('deberia confirmar y eliminar cuando se clickea eliminar y confirma', async () => {
        const problems = [mockProblem({ title: 'A' })];
        jest.spyOn(apiModule.api, 'getSandboxProblemsAdmin').mockResolvedValue({ problems });
        const deleteSpy = jest.spyOn(apiModule.api, 'deleteSandboxProblem').mockResolvedValue({ success: true });

        new AdminProblemsView();
        await new Promise(r => setTimeout(r, 0));

        document.querySelector('.delete-problem-btn')?.dispatchEvent(new Event('click'));

        const confirmModal = document.getElementById('delete-problem-modal');
        expect(confirmModal?.classList.contains('hidden')).toBe(false);

        document.getElementById('confirm-delete-problem-btn')?.click();
        await new Promise(r => setTimeout(r, 0));

        expect(deleteSpy).toHaveBeenCalledWith('p1');
    });
});