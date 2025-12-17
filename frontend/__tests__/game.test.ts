import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GameView } from '../src/views/game';
import * as apiModule from '../src/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Tamagotchi class
jest.mock('../src/tamagotchi', () => {
    return {
        Tamagotchi: jest.fn().mockImplementation(() => {
            return {
                setEmotion: jest.fn()
            };
        })
    };
});

describe('GameManager', () => {
    let alertSpy: jest.SpiedFunction<typeof window.alert>;

    beforeEach(() => {
        const htmlPath = path.resolve(__dirname, '../src/views/game.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        document.body.innerHTML = htmlContent;
        jest.clearAllMocks();
        alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
    });

    it('deberia cargar la pregunta inicial y la racha del usuario al iniciar', async () => {
        const mockQuestion = {
            _id: 'q1',
            text: '¿Qué es HTML?',
            topic: 'Topic'
        };

        const mockProfile = {
            email: 'test@test.com',
            streak: 5,
            _id: '',
            createdAt: ''
        };

        const questionSpy = jest.spyOn(apiModule.api, 'getRandomQuestion').mockResolvedValue(mockQuestion);
        const profileSpy = jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue(mockProfile);

        new GameView();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(questionSpy).toHaveBeenCalledTimes(1);
        expect(profileSpy).toHaveBeenCalledTimes(1);

        const questionText = document.getElementById('question-text');
        const streakNumber = document.querySelector('.streak-number');

        expect(questionText?.textContent).toBe(mockQuestion.text);
        expect(streakNumber?.textContent).toBe(mockProfile.streak.toString());
    });

    it('deberia manejar el error al cargar la pregunta', async () => {
        jest.spyOn(apiModule.api, 'getRandomQuestion').mockRejectedValue(new Error('Network error'));
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({
            email: 'test', streak: 0,
            _id: '',
            createdAt: ''
        });

        new GameView();

        await new Promise(resolve => setTimeout(resolve, 0));

        const questionText = document.getElementById('question-text');
        expect(questionText?.textContent).toContain('Error al cargar la pregunta');
    });

    it('deberia mostrar alerta si se intenta enviar respuesta vacia', async () => {
        jest.spyOn(apiModule.api, 'getRandomQuestion').mockResolvedValue({ _id: '1', text: 'Q', topic: 'Topic' });
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({
            email: 'test', streak: 0,
            _id: '',
            createdAt: ''
        });

        new GameView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const submitBtn = document.getElementById('submit-answer-btn') as HTMLButtonElement;
        const input = document.getElementById('answer-input') as HTMLTextAreaElement;
        input.value = '   ';

        submitBtn.click();

        expect(alertSpy).toHaveBeenCalledWith('Por favor, escribe una respuesta');
    });

    it('deberia enviar la respuesta y actualizar la UI cuando es correcta', async () => {
        const mockQuestion = { _id: 'q1', text: 'Question', topic: 'Topic' };
        jest.spyOn(apiModule.api, 'getRandomQuestion').mockResolvedValue(mockQuestion);
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({
            email: 'test', streak: 0,
            _id: '',
            createdAt: ''
        });

        const mockResponse: {
            rating: 'correct' | 'partial' | 'incorrect';
            feedback: string;
            newStreak: number;
        } = {
            rating: 'correct',
            feedback: 'Muy bien!',
            newStreak: 1,
        };
        const submitSpy = jest.spyOn(apiModule.api, 'submitAnswer').mockResolvedValue(mockResponse);

        new GameView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const submitBtn = document.getElementById('submit-answer-btn') as HTMLButtonElement;
        const input = document.getElementById('answer-input') as HTMLTextAreaElement;
        const feedbackSection = document.getElementById('feedback-section') as HTMLElement;
        const feedbackText = document.getElementById('feedback-text') as HTMLElement;

        input.value = 'My Answer';
        submitBtn.click();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(submitSpy).toHaveBeenCalledWith(mockQuestion._id, mockQuestion.text, 'My Answer');
        expect(feedbackSection.classList.contains('hidden')).toBe(false);
        expect(feedbackSection.classList.contains('correct')).toBe(true);
        expect(feedbackText.textContent).toBe(mockResponse.feedback);
    });

    it('deberia manejar errores al enviar respuesta', async () => {
        const mockQuestion = { _id: 'q1', text: 'Question', topic: 'Topic', options: [], correctAnswer: 'Answer' };
        jest.spyOn(apiModule.api, 'getRandomQuestion').mockResolvedValue(mockQuestion);
        jest.spyOn(apiModule.api, 'getProfile').mockResolvedValue({
            email: 'test', streak: 0,
            _id: '',
            createdAt: ''
        });

        jest.spyOn(apiModule.api, 'submitAnswer').mockRejectedValue(new Error('Submit error'));

        new GameView();
        await new Promise(resolve => setTimeout(resolve, 0));

        const submitBtn = document.getElementById('submit-answer-btn') as HTMLButtonElement;
        const input = document.getElementById('answer-input') as HTMLTextAreaElement;

        input.value = 'Answer';
        submitBtn.click();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(alertSpy).toHaveBeenCalledWith('Error al enviar la respuesta. Por favor, intenta de nuevo.');
        expect(submitBtn.disabled).toBe(false);
    });
});
