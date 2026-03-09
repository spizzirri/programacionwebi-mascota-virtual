import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { AdminQuestionsView } from '../src/views/admin-questions';
import * as apiModule from '../src/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AdminQuestionsView', () => {
    beforeEach(() => {
        const htmlPath = path.resolve(__dirname, '../src/views/admin-questions.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        document.body.innerHTML = htmlContent;
        jest.clearAllMocks();

        // Mock API
        jest.spyOn(apiModule.api, 'getAllQuestions').mockResolvedValue([]);
        jest.spyOn(apiModule.api, 'getAllTopics').mockResolvedValue([]);
    });

    it('deberia cargar y renderizar preguntas y tópicos al iniciar', async () => {
        const mockQuestions = [{ _id: 'q1', text: '¿Test?', topic: 'HTML' }];
        const mockTopics = [{ name: 'HTML', enabled: true }];

        jest.spyOn(apiModule.api, 'getAllQuestions').mockResolvedValue(mockQuestions as any);
        jest.spyOn(apiModule.api, 'getAllTopics').mockResolvedValue(mockTopics as any);

        new AdminQuestionsView();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(apiModule.api.getAllQuestions).toHaveBeenCalled();
        expect(apiModule.api.getAllTopics).toHaveBeenCalled();

        const tableBody = document.getElementById('questions-table-body');
        expect(tableBody?.textContent).toContain('¿Test?');

        const topicsList = document.getElementById('topics-list');
        expect(topicsList?.textContent).toContain('HTML');
    });

    it('deberia abrir el modal de tópico al hacer clic en un tópico del sidebar', async () => {
        const mockTopics = [{ name: 'HTML', enabled: true, startDate: '2025-01-01', endDate: '2025-12-31' }];
        jest.spyOn(apiModule.api, 'getAllTopics').mockResolvedValue(mockTopics as any);

        new AdminQuestionsView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const topicItem = document.querySelector('.topic-item') as HTMLElement;
        topicItem?.click();

        const modal = document.getElementById('topic-modal');
        expect(modal?.classList.contains('hidden')).toBe(false);

        const nameInput = document.getElementById('topic-name-hidden') as HTMLInputElement;
        expect(nameInput.value).toBe('HTML');

        const enabledCheckbox = document.getElementById('topic-enabled') as HTMLInputElement;
        expect(enabledCheckbox.checked).toBe(true);
    });

    it('deberia llamar a api.updateTopic al guardar el formulario de tópico', async () => {
        const updateSpy = jest.spyOn(apiModule.api, 'updateTopic').mockResolvedValue({} as any);
        const mockTopic = { name: 'CSS', enabled: true };
        jest.spyOn(apiModule.api, 'getAllTopics').mockResolvedValue([mockTopic] as any);

        const view = new AdminQuestionsView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        (view as any).openTopicModal(mockTopic);

        const enabledCheckbox = document.getElementById('topic-enabled') as HTMLInputElement;
        enabledCheckbox.checked = false;

        const form = document.getElementById('topic-form');
        form?.dispatchEvent(new Event('submit'));

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(updateSpy).toHaveBeenCalledWith('CSS', expect.objectContaining({
            enabled: false
        }));
    });

    it('deberia filtrar preguntas ignorando mayusculas y tildes cuando se usa el filtro de texto', async () => {
        const mockQuestions = [
            { _id: 'q1', text: '¿Qué es el DOM?', topic: 'HTML' },
            { _id: 'q2', text: 'Tipos de datos en JavaScript', topic: 'JS' },
        ];
        jest.spyOn(apiModule.api, 'getAllQuestions').mockResolvedValue(mockQuestions as any);

        new AdminQuestionsView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const filterInput = document.getElementById('filter-text') as HTMLInputElement;
        filterInput.value = 'QUE ES EL DOM';
        filterInput.dispatchEvent(new Event('input'));

        const tableBody = document.getElementById('questions-table-body');
        expect(tableBody?.textContent).toContain('¿Qué es el DOM?');
        expect(tableBody?.textContent).not.toContain('Tipos de datos en JavaScript');
    });
});
