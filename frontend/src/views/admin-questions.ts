import { api, Question } from '../api';
import { DOMManager } from '../dom-manager';

export class AdminQuestionsView extends DOMManager {
    private tableBody: HTMLElement;
    private questionModal: HTMLElement;
    private deleteModal: HTMLElement;
    private deleteAllModal: HTMLElement;
    private questionForm: HTMLFormElement;
    private questionIdInput: HTMLInputElement;
    private questionTextInput: HTMLInputElement;
    private questionTopicInput: HTMLInputElement;
    private modalTitle: HTMLElement;
    private deleteQuestionText: HTMLElement;
    private fileInput: HTMLInputElement;
    private filterTopicSelect: HTMLSelectElement;
    private filterTextInput: HTMLInputElement;
    private currentDeleteId: string | null = null;
    private questions: Question[] = [];
    private filteredQuestions: Question[] = [];

    constructor() {
        super();
        this.tableBody = this.getElementSafe<HTMLElement>('#questions-table-body');
        this.questionModal = this.getElementSafe<HTMLElement>('#question-modal');
        this.deleteModal = this.getElementSafe<HTMLElement>('#delete-modal');
        this.deleteAllModal = this.getElementSafe<HTMLElement>('#delete-all-modal');
        this.questionForm = this.getElementSafe<HTMLFormElement>('#question-form');
        this.questionIdInput = this.getElementSafe<HTMLInputElement>('#question-id');
        this.questionTextInput = this.getElementSafe<HTMLInputElement>('#question-text');
        this.questionTopicInput = this.getElementSafe<HTMLInputElement>('#question-topic');
        this.modalTitle = this.getElementSafe<HTMLElement>('#modal-title');
        this.deleteQuestionText = this.getElementSafe<HTMLElement>('#delete-question-text');
        this.fileInput = this.getElementSafe<HTMLInputElement>('#file-input');
        this.filterTopicSelect = this.getElementSafe<HTMLSelectElement>('#filter-topic');
        this.filterTextInput = this.getElementSafe<HTMLInputElement>('#filter-text');

        this.setupEventListeners();
        this.loadQuestions();
    }

    private setupEventListeners(): void {
        this.getElementSafe('#add-question-btn').addEventListener('click', () => this.openQuestionModal());
        this.getElementSafe('#close-modal').addEventListener('click', () => this.closeQuestionModal());
        this.getElementSafe('#close-delete-modal').addEventListener('click', () => this.closeDeleteModal());
        this.getElementSafe('#confirm-delete').addEventListener('click', () => this.handleDeleteQuestion());

        this.getElementSafe('#delete-all-btn').addEventListener('click', () => this.openDeleteAllModal());
        this.getElementSafe('#close-delete-all-modal').addEventListener('click', () => this.closeDeleteAllModal());
        this.getElementSafe('#confirm-delete-all').addEventListener('click', () => this.handleDeleteAllQuestions());

        this.getElementSafe('#import-questions-btn').addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        this.filterTopicSelect.addEventListener('change', () => this.applyFilters());
        this.filterTextInput.addEventListener('input', () => this.applyFilters());

        this.questionForm.addEventListener('submit', (e) => this.handleQuestionSubmit(e));

        [this.questionModal, this.deleteModal, this.deleteAllModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeQuestionModal();
                    this.closeDeleteModal();
                    this.closeDeleteAllModal();
                }
            });
        });
    }

    destroy(): void {
        super.destroy();
    }

    private async loadQuestions(): Promise<void> {
        try {
            this.questions = await api.getAllQuestions();
            this.updateTopicFilterOptions();
            this.applyFilters();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.clearContainer(this.tableBody);
            const row = this.createElement('tr');
            const cell = this.createElement('td', { colspan: '3', class: 'loading' }, 'Error al cargar las preguntas');
            this.appendToContainer(row, cell);
            this.appendToContainer(this.tableBody, row);
        }
    }

    private renderQuestions(questions: Question[]): void {
        this.clearContainer(this.tableBody);

        if (questions.length === 0) {
            const row = this.createElement('tr');
            const cell = this.createElement('td', { colspan: '3', class: 'loading' }, 'No hay preguntas registradas');
            this.appendToContainer(row, cell);
            this.appendToContainer(this.tableBody, row);
            return;
        }

        questions.forEach((question) => {
            const row = this.createElement('tr');

            const textCell = this.createElement('td', {}, question.text);
            const topicCell = this.createElement('td', {}, question.topic);

            const actionsCell = this.createElement('td');
            const actionsContainer = this.createElement('div', { class: 'action-buttons' });

            const editBtn = this.createElement('button', { class: 'btn-icon', title: 'Modificar' }, '✏️');
            editBtn.addEventListener('click', () => this.openQuestionModal(question));

            const deleteBtn = this.createElement('button', { class: 'btn-icon delete', title: 'Eliminar' }, '🗑️');
            deleteBtn.addEventListener('click', () => this.openDeleteModal(question));

            this.appendToContainer(actionsContainer, editBtn);
            this.appendToContainer(actionsContainer, deleteBtn);
            this.appendToContainer(actionsCell, actionsContainer);

            this.appendToContainer(row, textCell);
            this.appendToContainer(row, topicCell);
            this.appendToContainer(row, actionsCell);

            this.appendToContainer(this.tableBody, row);
        });
    }

    private openQuestionModal(question?: Question): void {
        this.questionForm.reset();
        if (question) {
            this.modalTitle.textContent = 'Modificar Pregunta';
            this.questionIdInput.value = question._id;
            this.questionTextInput.value = question.text;
            this.questionTopicInput.value = question.topic;
        } else {
            this.modalTitle.textContent = 'Agregar Pregunta';
            this.questionIdInput.value = '';
        }
        this.questionModal.classList.remove('hidden');
    }

    private closeQuestionModal(): void {
        this.questionModal.classList.add('hidden');
    }

    private async handleQuestionSubmit(e: Event): Promise<void> {
        e.preventDefault();
        const id = this.questionIdInput.value;
        const questionData: Partial<Question> = {
            text: this.questionTextInput.value,
            topic: this.questionTopicInput.value,
        };

        try {
            if (id) {
                await api.updateQuestion(id, questionData);
            } else {
                await api.createQuestion(questionData);
            }
            this.closeQuestionModal();
            this.loadQuestions();
        } catch (error) {
            alert('Error al guardar la pregunta: ' + (error as Error).message);
        }
    }

    private openDeleteModal(question: Question): void {
        this.currentDeleteId = question._id;
        this.deleteQuestionText.textContent = question.text;
        this.deleteModal.classList.remove('hidden');
    }

    private closeDeleteModal(): void {
        this.deleteModal.classList.add('hidden');
        this.currentDeleteId = null;
    }

    private openDeleteAllModal(): void {
        this.deleteAllModal.classList.remove('hidden');
    }

    private closeDeleteAllModal(): void {
        this.deleteAllModal.classList.add('hidden');
    }

    private async handleDeleteQuestion(): Promise<void> {
        if (!this.currentDeleteId) return;

        try {
            await api.deleteQuestion(this.currentDeleteId);
            this.closeDeleteModal();
            this.loadQuestions();
        } catch (error) {
            alert('Error al eliminar la pregunta: ' + (error as Error).message);
        }
    }

    private async handleDeleteAllQuestions(): Promise<void> {
        try {
            await api.deleteAllQuestions();
            this.closeDeleteAllModal();
            this.loadQuestions();
        } catch (error) {
            alert('Error al eliminar las preguntas: ' + (error as Error).message);
        }
    }

    private handleFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target?.result as string;
            if (content) {
                await this.processBulkQuestions(content);
            }
            input.value = '';
        };

        reader.onerror = () => {
            alert('Error al leer el archivo');
        };

        reader.readAsText(file);
    }

    private async processBulkQuestions(content: string): Promise<void> {
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) {
            alert('El archivo está vacío o no contiene preguntas válidas.');
            return;
        }

        const questionsData: { text: string, topic: string }[] = [];

        lines.forEach(line => {
            const parts = line.split(';');
            if (parts.length >= 2) {
                questionsData.push({
                    topic: parts[0].trim(),
                    text: parts.slice(1).join(';').trim()
                });
            }
        });

        if (questionsData.length === 0) {
            alert('No se encontraron líneas con el formato correcto (tópico;pregunta).');
            return;
        }

        try {
            await api.createQuestionsBulk(questionsData);
            alert(`Se han importado ${questionsData.length} preguntas correctamente.`);
            this.loadQuestions();
        } catch (error) {
            alert('Error al importar preguntas: ' + (error as Error).message);
        }
    }

    private updateTopicFilterOptions(): void {
        const topics = Array.from(new Set(this.questions.map(q => q.topic))).sort();
        const currentValue = this.filterTopicSelect.value;

        this.clearContainer(this.filterTopicSelect);

        const allOption = this.createElement('option', { value: '' }, 'Todos los tópicos');
        this.appendToContainer(this.filterTopicSelect, allOption);

        topics.forEach(topic => {
            const option = this.createElement('option', { value: topic }, topic);
            this.appendToContainer(this.filterTopicSelect, option);
        });

        if (topics.includes(currentValue)) {
            this.filterTopicSelect.value = currentValue;
        }
    }

    private applyFilters(): void {
        const selectedTopic = this.filterTopicSelect.value;
        const searchText = this.filterTextInput.value.toLowerCase();

        this.filteredQuestions = this.questions.filter(q => {
            const matchesTopic = selectedTopic === '' || q.topic === selectedTopic;
            const matchesText = q.text.toLowerCase().includes(searchText);
            return matchesTopic && matchesText;
        });

        this.renderQuestions(this.filteredQuestions);
    }

    refresh(): void {
        this.loadQuestions();
    }
}
