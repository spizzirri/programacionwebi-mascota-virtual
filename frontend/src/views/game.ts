import { api, Question } from '../api';
import { DOMManager } from '../dom-manager';
import { session } from '../session';
import { VirtualPet } from '../virtual-pet';
import { syncStreakWithWidget } from '../pwa';

export class GameView extends DOMManager {
    private virtualPet: VirtualPet;
    private currentQuestion: Question | null = null;
    private currentStreak: number = 0;
    private isLoadingQuestion: boolean = false;

    private questionText: HTMLElement;
    private answerInput: HTMLTextAreaElement;
    private submitButton: HTMLButtonElement;
    private feedbackSection: HTMLElement;
    private feedbackText: HTMLElement;
    private nextQuestionButton: HTMLButtonElement;
    private appealButton: HTMLButtonElement;
    private streakNumber: SVGTextElement;
    private streakDisplay: HTMLElement;
    private lastAnswerId: string | null = null;

    constructor() {
        super();
        this.virtualPet = new VirtualPet('tamagotchi-container');

        this.questionText = this.getElementSafe<HTMLElement>('#question-text');
        this.answerInput = this.getElementSafe<HTMLTextAreaElement>('#answer-input');
        this.submitButton = this.getElementSafe<HTMLButtonElement>('#submit-answer-btn');
        this.feedbackSection = this.getElementSafe<HTMLElement>('#feedback-section');
        this.feedbackText = this.getElementSafe<HTMLElement>('#feedback-text');
        this.nextQuestionButton = this.getElementSafe<HTMLButtonElement>('#next-question-btn');
        this.appealButton = this.getElementSafe<HTMLButtonElement>('#appeal-btn');
        this.streakNumber = this.getElementSafe<SVGTextElement>('.streak-number');
        this.streakDisplay = this.getElementSafe<HTMLElement>('.streak-display');

        const user = session.getUser();
        if (user && user.role === 'STUDENT') {
            this.addClass(this.nextQuestionButton, 'hidden');
        }

        this.setupEventListeners();
        this.loadQuestion();
        this.loadUserStreak();
    }

    destroy(): void {
        super.destroy();
    }

    private setupEventListeners(): void {
        this.attachEvent(this.submitButton, 'click', () => this.handleSubmitAnswer());
        this.attachEvent(this.nextQuestionButton, 'click', () => this.loadQuestion());
        this.attachEvent(this.appealButton, 'click', () => this.handleAppeal());
    }

    private async loadUserStreak(): Promise<void> {
        try {
            const profile = await api.getProfile();
            this.currentStreak = profile.streak;
            this.updateStreakDisplay(this.currentStreak);
        } catch (error) {
            throw new Error('Error loading user streak');
        }
    }

    private async loadQuestion(): Promise<void> {
        if (this.isLoadingQuestion) {
            console.log('Already loading a question, ignoring duplicate request');
            return;
        }

        this.isLoadingQuestion = true;
        this.nextQuestionButton.disabled = true;

        try {
            this.addClass(this.feedbackSection, 'hidden');
            this.removeClass(this.feedbackSection, 'correct');
            this.removeClass(this.feedbackSection, 'partial');
            this.removeClass(this.feedbackSection, 'incorrect');
            this.addClass(this.appealButton, 'hidden');

            const answerSection = this.getElementSafe<HTMLElement>('.answer-section');
            this.removeClass(answerSection, 'hidden');

            this.answerInput.value = '';
            this.answerInput.disabled = false;
            this.virtualPet.setEmotion('neutral');

            const response = await api.getRandomQuestion();

            if (response.hasAnswered) {
                this.currentQuestion = response.question;
                this.setTextContent(this.questionText, 'Ya has respondido la pregunta del día, vuelve mañana');
                this.addClass(answerSection, 'hidden');
                this.nextQuestionButton.disabled = true;

                if (response.answerId && response.rating !== 'correct') {
                    this.lastAnswerId = response.answerId;
                    this.removeClass(this.appealButton, 'hidden');
                    this.appealButton.disabled = false;
                    this.setTextContent(this.appealButton, 'SOLICITAR REVISION');
                }
                return;
            }

            this.currentQuestion = response.question;
            this.setTextContent(this.questionText, this.currentQuestion.text);

            this.submitButton.disabled = false;
        } catch (error) {
            this.showAlert('Error al cargar la pregunta. Por favor, intenta de nuevo.');
            this.submitButton.disabled = false;
        } finally {
            this.isLoadingQuestion = false;
        }
    }

    private async handleSubmitAnswer(): Promise<void> {
        if (!this.currentQuestion) {
            return;
        }

        const userAnswer = this.answerInput.value.trim();
        if (!userAnswer) {
            this.showAlert('Por favor, escribe una respuesta');
            return;
        }

        this.answerInput.disabled = true;
        this.submitButton.disabled = true;
        this.setTextContent(this.submitButton, 'Validando...');

        try {
            const result = await api.submitAnswer(
                this.currentQuestion._id,
                userAnswer
            );

            this.currentStreak = result.newStreak;
            this.updateStreakDisplay(result.newStreak);

            if (result.rating === 'correct') {
                this.virtualPet.setEmotion('happy');
                this.addClass(this.feedbackSection, 'correct');
                syncStreakWithWidget();
            } else if (result.rating === 'partial') {
                this.virtualPet.setEmotion('neutral');
                this.addClass(this.feedbackSection, 'partial');
            } else {
                this.virtualPet.setEmotion('sad');
                this.addClass(this.feedbackSection, 'incorrect');
            }

            this.lastAnswerId = result.answerId;

            if (result.rating !== 'correct') {
                this.removeClass(this.appealButton, 'hidden');
                this.appealButton.disabled = false;
                this.setTextContent(this.appealButton, 'SOLICITAR REVISION');
            } else {
                this.addClass(this.appealButton, 'hidden');
            }


            this.setTextContent(this.feedbackText, result.feedback);
            this.removeClass(this.feedbackSection, 'hidden');
            this.setTextContent(this.submitButton, 'Enviar Respuesta');

            const user = session.getUser();
            if (user && user.role === 'PROFESSOR') {
                this.nextQuestionButton.disabled = false;
                this.removeClass(this.nextQuestionButton, 'hidden');
            }
        } catch (error) {
            this.showAlert('Error al enviar la respuesta. Por favor, intenta de nuevo.');
            this.answerInput.disabled = false;
            this.submitButton.disabled = false;
            this.setTextContent(this.submitButton, 'Enviar Respuesta');
        }

    }

    private async handleAppeal(): Promise<void> {
        if (!this.lastAnswerId) return;

        this.appealButton.disabled = true;
        this.setTextContent(this.appealButton, 'Enviando...');

        try {
            await api.createAppeal(this.lastAnswerId);
            this.setTextContent(this.appealButton, 'Revision Solicitada');
            this.showAlert('Tu solicitud de revisión ha sido enviada correctamente.');
        } catch (error) {
            this.showAlert('Error al enviar la solicitud de revisión.');
            this.appealButton.disabled = false;
            this.setTextContent(this.appealButton, 'SOLICITAR REVISION');
        }
    }


    private updateStreakDisplay(streak: number): void {
        this.streakNumber.textContent = streak.toString();

        this.removeClass(this.streakDisplay, 'streak-updated');
        void this.streakDisplay.offsetWidth;
        this.addClass(this.streakDisplay, 'streak-updated');
    }
}
