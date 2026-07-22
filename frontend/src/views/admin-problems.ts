import { api, Problem, ProblemInput, TestCase } from '../api';
import { DOMManager } from '../dom-manager';

export class AdminProblemsView extends DOMManager {
    private tableBody: HTMLElement;
    private problemModal: HTMLElement;
    private deleteModal: HTMLElement;
    private titleInput: HTMLInputElement;
    private descriptionInput: HTMLTextAreaElement;
    private idInput: HTMLInputElement;
    private paramsContainer: HTMLElement;
    private testCasesContainer: HTMLElement;
    private formError: HTMLElement;
    private problems: Problem[] = [];
    private pendingDeleteId: string | null = null;

    constructor() {
        super();
        this.tableBody = this.getElementSafe<HTMLElement>('#problems-table-body');
        this.problemModal = this.getElementSafe<HTMLElement>('#problem-modal');
        this.deleteModal = this.getElementSafe<HTMLElement>('#delete-problem-modal');
        this.titleInput = this.getElementSafe<HTMLInputElement>('#problem-title');
        this.descriptionInput = this.getElementSafe<HTMLTextAreaElement>('#problem-description');
        this.idInput = this.getElementSafe<HTMLInputElement>('#problem-id');
        this.paramsContainer = this.getElementSafe<HTMLElement>('#params-container');
        this.testCasesContainer = this.getElementSafe<HTMLElement>('#test-cases-container');
        this.formError = this.getElementSafe<HTMLElement>('#problem-form-error');

        this.setupEventListeners();
        this.loadProblems();
    }

    destroy(): void {
        super.destroy();
    }

    private setupEventListeners(): void {
        this.attachEvent(this.getElementSafe('#add-problem-btn'), 'click', () => this.openCreateModal());
        this.attachEvent(this.getElementSafe('#close-problem-modal'), 'click', () => this.closeProblemModal());
        this.attachEvent(this.getElementSafe('#save-problem-btn'), 'click', () => this.handleSave());
        this.attachEvent(this.getElementSafe('#add-param-btn'), 'click', () => this.addParam());
        this.attachEvent(this.getElementSafe('#add-test-case-btn'), 'click', () => this.addTestCase());
        this.attachEvent(this.getElementSafe('#close-delete-problem-modal'), 'click', () => this.closeDeleteModal());
        this.attachEvent(this.getElementSafe('#confirm-delete-problem-btn'), 'click', () => this.handleDelete());

        [this.problemModal, this.deleteModal].forEach(modal => {
            this.attachEvent(modal, 'click', (e: MouseEvent) => {
                if (e.target === modal) {
                    this.closeProblemModal();
                    this.closeDeleteModal();
                }
            });
        });
    }

    private async loadProblems(): Promise<void> {
        try {
            const response = await api.getSandboxProblemsAdmin();
            this.problems = response.problems;
            this.renderTable();
        } catch (err) {
            this.clearContainer(this.tableBody);
            const row = this.createElement('tr');
            const cell = this.createElement('td', { colspan: '6', class: 'loading' }, 'Error al cargar problemas');
            this.appendToContainer(row, cell);
            this.appendToContainer(this.tableBody, row);
        }
    }

    private renderTable(): void {
        this.clearContainer(this.tableBody);
        if (this.problems.length === 0) {
            const row = this.createElement('tr');
            const cell = this.createElement('td', { colspan: '6', class: 'loading' }, 'No hay problemas cargados');
            this.appendToContainer(row, cell);
            this.appendToContainer(this.tableBody, row);
            return;
        }
        for (const problem of this.problems) {
            this.appendToContainer(this.tableBody, this.buildRow(problem));
        }
    }

    private buildRow(problem: Problem): HTMLTableRowElement {
        const row = this.createElement('tr') as HTMLTableRowElement;
        this.appendToContainer(row, this.createElement('td', {}, problem.title));
        this.appendToContainer(row, this.createElement('td', {}, problem.params.join(', ')));
        this.appendToContainer(row, this.createElement('td', {}, String(problem.testCases.length)));
        const samples = problem.testCases.filter(tc => tc.sample).length;
        this.appendToContainer(row, this.createElement('td', {}, String(samples)));
        this.appendToContainer(row, this.createElement('td', {}, problem.active ? 'Sí' : 'No'));

        const actions = this.createElement('td');
        const editBtn = this.createElement('button', { class: 'btn-secondary edit-problem-btn' }, 'Editar');
        const deleteBtn = this.createElement('button', { class: 'btn-secondary btn-danger delete-problem-btn' }, 'Eliminar');
        this.attachEvent(editBtn, 'click', () => this.openEditModal(problem));
        this.attachEvent(deleteBtn, 'click', () => this.askDelete(problem));
        this.appendToContainer(actions, editBtn);
        this.appendToContainer(actions, deleteBtn);
        this.appendToContainer(row, actions);
        return row;
    }

    private openCreateModal(): void {
        this.idInput.value = '';
        this.titleInput.value = '';
        this.descriptionInput.value = '';
        this.clearContainer(this.paramsContainer);
        this.clearContainer(this.testCasesContainer);
        this.formError.textContent = '';
        this.setTextContent(this.getElementSafe('#problem-modal-title'), 'Agregar Problema');
        this.removeClass(this.problemModal, 'hidden');
    }

    private openEditModal(problem: Problem): void {
        this.idInput.value = problem._id;
        this.titleInput.value = problem.title;
        this.descriptionInput.value = problem.description;
        this.clearContainer(this.paramsContainer);
        problem.params.forEach(p => this.addParam(p));
        this.clearContainer(this.testCasesContainer);
        problem.testCases.forEach(tc => this.addTestCase(tc));
        this.formError.textContent = '';
        this.setTextContent(this.getElementSafe('#problem-modal-title'), 'Editar Problema');
        this.removeClass(this.problemModal, 'hidden');
    }

    private closeProblemModal(): void {
        this.addClass(this.problemModal, 'hidden');
    }

    private addParam(value: string = ''): void {
        const wrapper = this.createElement('div', { class: 'param-row' });
        const input = this.createElement('input', { type: 'text', class: 'param-input form-control', placeholder: 'nombre' }) as HTMLInputElement;
        input.value = value;
        const removeBtn = this.createElement('button', { type: 'button', class: 'btn-secondary remove-param-btn' }, 'Eliminar');
        this.attachEvent(removeBtn, 'click', () => wrapper.remove());
        this.appendToContainer(wrapper, input);
        this.appendToContainer(wrapper, removeBtn);
        this.appendToContainer(this.paramsContainer, wrapper);
    }

    private addTestCase(tc: TestCase | null = null): void {
        const row = this.createElement('div', { class: 'test-case-row' });
        const inputLabel = this.createElement('label', {}, 'Input (JSON)');
        const inputArea = this.createElement('textarea', { class: 'test-input form-control', rows: '2' }) as HTMLTextAreaElement;
        const expectedLabel = this.createElement('label', {}, 'Expected (JSON)');
        const expectedArea = this.createElement('textarea', { class: 'test-expected form-control', rows: '2' }) as HTMLTextAreaElement;
        const sampleLabel = this.createElement('label', {}, 'Visible para el alumno');
        const sampleCheck = this.createElement('input', { type: 'checkbox', class: 'test-sample' }) as HTMLInputElement;
        const removeBtn = this.createElement('button', { type: 'button', class: 'btn-secondary remove-test-btn' }, 'Eliminar');
        if (tc) {
            inputArea.value = JSON.stringify(tc.input);
            expectedArea.value = JSON.stringify(tc.expected);
            sampleCheck.checked = tc.sample;
        }
        this.attachEvent(removeBtn, 'click', () => row.remove());
        this.appendToContainer(row, inputLabel);
        this.appendToContainer(row, inputArea);
        this.appendToContainer(row, expectedLabel);
        this.appendToContainer(row, expectedArea);
        this.appendToContainer(row, sampleLabel);
        this.appendToContainer(row, sampleCheck);
        this.appendToContainer(row, removeBtn);
        this.appendToContainer(this.testCasesContainer, row);
    }

    private collectForm(): ProblemInput | { error: string } {
        const title = this.titleInput.value.trim();
        const description = this.descriptionInput.value.trim();
        if (!title) {
            return { error: 'El título es obligatorio' };
        }
        if (!description) {
            return { error: 'La descripción es obligatoria' };
        }
        const params: string[] = [];
        const paramInputs = this.paramsContainer.querySelectorAll('.param-input');
        paramInputs.forEach((el: Element) => {
            const value = (el as HTMLInputElement).value.trim();
            if (value) {
                params.push(value);
            }
        });
        if (params.length === 0) {
            return { error: 'Debe definir al menos un parámetro' };
        }
        const testCases: TestCase[] = [];
        const rows = this.testCasesContainer.querySelectorAll('.test-case-row');
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const inputRaw = (row.querySelector('.test-input') as HTMLTextAreaElement).value.trim();
            const expectedRaw = (row.querySelector('.test-expected') as HTMLTextAreaElement).value.trim();
            let parsedInput: unknown;
            let parsedExpected: unknown;
            try {
                parsedInput = JSON.parse(inputRaw);
            } catch {
                return { error: `Test ${i + 1}: input no es JSON válido` };
            }
            try {
                parsedExpected = JSON.parse(expectedRaw);
            } catch {
                return { error: `Test ${i + 1}: expected no es JSON válido` };
            }
            if (!Array.isArray(parsedInput)) {
                return { error: `Test ${i + 1}: input debe ser un array JSON` };
            }
            testCases.push({
                input: parsedInput,
                expected: parsedExpected,
                sample: (row.querySelector('.test-sample') as HTMLInputElement).checked,
            });
        }
        if (testCases.length === 0) {
            return { error: 'Debe definir al menos un caso de test' };
        }
        return { title, description, params, testCases, active: true };
    }

    private async handleSave(): Promise<void> {
        const result = this.collectForm();
        if ('error' in result) {
            this.formError.textContent = result.error;
            return;
        }
        this.formError.textContent = '';
        try {
            const id = this.idInput.value;
            if (id) {
                await api.updateSandboxProblem(id, result);
            } else {
                await api.createSandboxProblem(result);
            }
            this.closeProblemModal();
            await this.loadProblems();
        } catch (err: unknown) {
            this.formError.textContent = err instanceof Error ? err.message : 'Error al guardar';
        }
    }

    private askDelete(problem: Problem): void {
        this.pendingDeleteId = problem._id;
        this.removeClass(this.deleteModal, 'hidden');
    }

    private closeDeleteModal(): void {
        this.addClass(this.deleteModal, 'hidden');
        this.pendingDeleteId = null;
    }

    private async handleDelete(): Promise<void> {
        if (!this.pendingDeleteId) {
            return;
        }
        try {
            await api.deleteSandboxProblem(this.pendingDeleteId);
            this.closeDeleteModal();
            await this.loadProblems();
        } catch (err: unknown) {
            this.showAlert(err instanceof Error ? err.message : 'Error al eliminar');
        }
    }
}