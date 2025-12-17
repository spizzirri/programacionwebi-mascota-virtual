import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ProfileView } from '../src/views/profile';
import * as apiModule from '../src/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ProfileManager', () => {

    beforeEach(() => {
        const htmlPath = path.resolve(__dirname, '../src/views/profile.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        document.body.innerHTML = htmlContent;
        jest.clearAllMocks();
    });

    it('deberia cargar el perfil y el historial al iniciar', async () => {
        const mockProfile = { email: 'test@test.com', streak: 10, _id: '', createdAt: '' };
        const mockHistory: apiModule.Answer[] = [
            {
                _id: '',
                userId: '',
                questionId: '',
                questionText: 'Q1',
                userAnswer: 'A1',
                feedback: 'F1',
                rating: 'correct',
                timestamp: new Date().toISOString()
            }
        ];

        const profileSpy = jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue(mockProfile);
        const historySpy = jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue(mockHistory);

        new ProfileView();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(profileSpy).toHaveBeenCalledTimes(1);
        expect(historySpy).toHaveBeenCalledWith(50);

        const email = document.getElementById('profile-email');
        const streak = document.getElementById('profile-streak');
        const historyItems = document.querySelectorAll('.history-item');

        expect(email?.textContent).toBe(mockProfile.email);
        expect(streak?.textContent).toBe(mockProfile.streak.toString());
        expect(historyItems.length).toBe(1);
    });

    it('deberia manejar error al cargar perfil', async () => {
        jest.spyOn(apiModule.api, 'getProfile').mockRejectedValue(new Error('Profile error'));
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue([]);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const email = document.getElementById('profile-email');
        const streak = document.getElementById('profile-streak');

        expect(email?.textContent).toBe('Error');
        expect(streak?.textContent).toBe('0');
    });

    it('deberia manejar error al cargar historial', async () => {
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '' });
        jest.spyOn(apiModule.api, 'getHistory').mockRejectedValue(new Error('History error'));

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const historyContainer = document.getElementById('history-container');
        expect(historyContainer?.innerHTML).toContain('Error al cargar el historial');
    });

    it('deberia mostrar mensaje cuando no hay historial', async () => {
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '' });
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue([]);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const historyContainer = document.getElementById('history-container');
        expect(historyContainer?.innerHTML).toContain('No hay respuestas todavía');
    });

    it('deberia renderizar correctamente items del historial', async () => {
        const now = new Date();
        const mockHistory: apiModule.Answer[] = [
            {
                _id: '',
                userId: '',
                questionId: '',
                questionText: 'Q1',
                userAnswer: 'A1',
                feedback: 'F1',
                rating: 'correct',
                timestamp: now.toISOString()
            }
        ];

        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '' });
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue(mockHistory);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const historyItem = document.querySelector('.history-item');
        expect(historyItem?.classList.contains('correct')).toBe(true);
        expect(historyItem?.querySelector('.history-question')?.textContent).toBe('Q1');
        expect(historyItem?.querySelector('.history-answer')?.textContent).toBe('Tu respuesta: A1');
        expect(historyItem?.querySelector('.history-feedback')?.textContent).toBe('F1');
        expect(historyItem?.querySelector('.history-timestamp')?.textContent).toBe('Hace un momento');
    });
});
