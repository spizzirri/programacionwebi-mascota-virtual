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
        const mockProfile: apiModule.User = { email: 'test@test.com', streak: 10, _id: '', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null };
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
        expect(historySpy).toHaveBeenCalledWith(50, undefined);

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
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null } as apiModule.User);
        jest.spyOn(apiModule.api, 'getHistory').mockRejectedValue(new Error('History error'));

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const historyContainer = document.getElementById('history-container');
        expect(historyContainer?.innerHTML).toContain('Error al cargar el historial');
    });

    it('deberia mostrar mensaje cuando no hay historial', async () => {
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null } as apiModule.User);
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

        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null } as apiModule.User);
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue(mockHistory);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const historyItem = document.querySelector('.history-item');
        expect(historyItem?.classList.contains('correct')).toBe(true);
        expect(historyItem?.querySelector('.history-question')?.textContent).toBe('Pregunta: Q1');
        expect(historyItem?.querySelector('.history-answer')?.textContent).toBe('Tu respuesta: A1');
        expect(historyItem?.querySelector('.history-feedback')?.textContent).toBe('F1');
        expect(historyItem?.querySelector('.history-timestamp')?.textContent).toBe('Hace un momento');
    });

    it('deberia escapar HTML en el texto de la pregunta del historial', async () => {
        const mockHistory: apiModule.Answer[] = [
            {
                _id: '',
                userId: '',
                questionId: '',
                questionText: 'Si un <input> en un formulario carece del atributo name, ¿qué ocurre al enviarlo?',
                userAnswer: 'A1',
                feedback: 'F1',
                rating: 'correct',
                timestamp: new Date().toISOString()
            }
        ];

        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null } as apiModule.User);
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue(mockHistory);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const questionEl = document.querySelector('.history-question');
        expect(questionEl?.innerHTML).toBe('<strong>Pregunta: </strong>Si un &lt;input&gt; en un formulario carece del atributo name, ¿qué ocurre al enviarlo?');
    });

    it('deberia mostrar el formulario de contraseña solo en el perfil propio', async () => {
        const mockProfile: apiModule.User = { email: 'test', streak: 0, _id: 'my-id', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null };
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue(mockProfile);
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue([]);

        const view = new ProfileView();

        await new Promise(resolve => setTimeout(resolve, 0));
        const passwordSection = document.getElementById('password-change-section');
        expect(passwordSection?.classList.contains('hidden')).toBe(false);
        view.setParams({ id: 'other-id' });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(passwordSection?.classList.contains('hidden')).toBe(true);
    });

    it('deberia validar que las contraseñas coincidan', async () => {
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null } as apiModule.User);
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue([]);
        const alertSpy = jest.spyOn(window, 'alert').mockReturnValue(undefined);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const newPwd = document.getElementById('new-password') as HTMLInputElement;
        const confirmPwd = document.getElementById('confirm-password') as HTMLInputElement;
        const form = document.getElementById('password-form') as HTMLFormElement;

        newPwd.value = 'pass1';
        confirmPwd.value = 'pass2';

        form.dispatchEvent(new Event('submit'));

        expect(alertSpy).toHaveBeenCalledWith('Las contraseñas no coinciden');
    });

    it('deberia mostrar un boton de descarga CSV en la seccion de historial', async () => {
        const mockProfile = { email: 'test@test.com', streak: 10, _id: '', createdAt: '', role: 'STUDENT' as const, currentQuestionId: null, lastQuestionAssignedAt: null };
        const mockHistory: apiModule.Answer[] = [
            {
                _id: '1',
                userId: '',
                questionId: '',
                questionText: '¿Qué es HTML?',
                userAnswer: 'Lenguaje de marcado',
                feedback: 'Correcto',
                rating: 'correct',
                timestamp: new Date().toISOString()
            }
        ];

        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue(mockProfile);
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue(mockHistory);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const downloadBtn = document.querySelector('.btn-download-csv');
        expect(downloadBtn).not.toBeNull();
        expect(downloadBtn?.tagName).toBe('BUTTON');
        expect(downloadBtn?.getAttribute('title')).toBe('Descargar CSV');
    });

    it('deberia descargar un archivo CSV con preguntas, respuestas y calificaciones al hacer clic en el boton', async () => {
        const mockHistory: apiModule.Answer[] = [
            {
                _id: '1',
                userId: '',
                questionId: '',
                questionText: 'Pregunta 1',
                userAnswer: 'Respuesta 1',
                feedback: 'Feedback 1',
                rating: 'correct',
                timestamp: new Date().toISOString()
            },
            {
                _id: '2',
                userId: '',
                questionId: '',
                questionText: 'Pregunta con, coma',
                userAnswer: 'Respuesta "entre comillas"',
                feedback: 'Feedback 2',
                rating: 'partial',
                timestamp: new Date().toISOString()
            }
        ];

        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT' as const, currentQuestionId: null, lastQuestionAssignedAt: null });
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue(mockHistory);

        let capturedBlob: Blob | null = null;
        (URL as any).createObjectURL = (blob: Blob) => {
            capturedBlob = blob;
            return 'blob:mock-url';
        };
        (URL as any).revokeObjectURL = jest.fn();

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const downloadBtn = document.querySelector('.btn-download-csv') as HTMLButtonElement;
        downloadBtn?.click();

        expect(capturedBlob).not.toBeNull();

        const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(capturedBlob!);
        });
        const lines = text.split('\n');

        expect(lines[0]).toBe('Pregunta,Respuesta,Calificación');
        expect(lines[1]).toContain('Pregunta 1');
        expect(lines[1]).toContain('Respuesta 1');
        expect(lines[1]).toContain('Correcta');
        expect(lines[2]).toContain('"Pregunta con, coma"');
        expect(lines[2]).toContain('"Respuesta ""entre comillas"""');
        expect(lines[2]).toContain('Parcial');
    });

    it('deberia ocultar el boton de descarga CSV cuando no hay historial', async () => {
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT' as const, currentQuestionId: null, lastQuestionAssignedAt: null });
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue([]);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const downloadBtn = document.querySelector('.btn-download-csv');
        expect(downloadBtn).not.toBeNull();
        expect(downloadBtn?.classList.contains('hidden')).toBe(true);
    });

    it('deberia llamar a api.updateProfilePassword al enviar el formulario correctamente', async () => {
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({ email: 'test', streak: 0, _id: '', createdAt: '', role: 'STUDENT', currentQuestionId: null, lastQuestionAssignedAt: null } as apiModule.User);
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue([]);
        const updateSpy = jest.spyOn(apiModule.api, 'updateProfilePassword').mockResolvedValue(undefined);
        jest.spyOn(window, 'alert').mockReturnValue(undefined);

        new ProfileView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const currentPwd = document.getElementById('current-password') as HTMLInputElement;
        const newPwd = document.getElementById('new-password') as HTMLInputElement;
        const confirmPwd = document.getElementById('confirm-password') as HTMLInputElement;
        const form = document.getElementById('password-form') as HTMLFormElement;

        currentPwd.value = 'oldPassword';
        newPwd.value = 'secret123';
        confirmPwd.value = 'secret123';

        form.dispatchEvent(new Event('submit'));

        expect(updateSpy).toHaveBeenCalledWith('oldPassword', 'secret123');
    });

    it('deberia cargar el perfil del usuario seleccionado, no el propio, cuando se navega desde admin-users con delay en la llamada', async () => {
        const mockOwnProfile = { email: 'profesor@gmail.com', streak: 5, _id: 'prof-id', createdAt: '', role: 'PROFESSOR' as const, currentQuestionId: null, lastQuestionAssignedAt: null };
        const mockTargetProfile = { email: 'estudiante@gmail.com', streak: 3, _id: 'est-id', createdAt: '', role: 'STUDENT' as const, currentQuestionId: null, lastQuestionAssignedAt: null };

        let resolveProfile: (value: apiModule.User) => void;
        const profilePromise = new Promise<apiModule.User>(resolve => { resolveProfile = resolve; });

        let callOrder: string[] = [];
        jest.spyOn(apiModule.api, 'getProfile').mockImplementation(async (userId?: string) => {
            if (userId) {
                callOrder.push('target');
                return mockTargetProfile;
            } else {
                callOrder.push('own');
                await profilePromise;
                return mockOwnProfile;
            }
        });
        jest.spyOn(apiModule.api, 'getHistory').mockResolvedValue([]);

        const view = new ProfileView();

        view.setParams({ id: 'est-id' });
        await new Promise(resolve => setTimeout(resolve, 10));

        resolveProfile!(mockOwnProfile);
        await new Promise(resolve => setTimeout(resolve, 50));

        const email = document.getElementById('profile-email');
        expect(email?.textContent).toBe('estudiante@gmail.com');
        expect(callOrder).toEqual(['own', 'target']);
    });
});
