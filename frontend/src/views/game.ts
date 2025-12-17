// Game logic - questions, answers, and Tamagotchi interaction

import { api, Question } from '../api';
import { DOMManager } from '../dom-manager';
import { Tamagotchi } from '../tamagotchi';

export class GameView extends DOMManager {
    private tamagotchi: Tamagotchi;
    private currentQuestion: Question | null = null;
    private currentStreak: number = 0;
    private isLoadingQuestion: boolean = false;

    private questionText: HTMLElement;
    private answerInput: HTMLTextAreaElement;
    private submitButton: HTMLButtonElement;
    private feedbackSection: HTMLElement;
    private feedbackText: HTMLElement;
    private nextQuestionButton: HTMLButtonElement;
    private streakNumber: SVGTextElement;
    private streakDisplay: HTMLElement;

    constructor() {
        super();
        this.tamagotchi = new Tamagotchi('tamagotchi-container');

        this.questionText = this.getElementSafe<HTMLElement>('#question-text');
        this.answerInput = this.getElementSafe<HTMLTextAreaElement>('#answer-input');
        this.submitButton = this.getElementSafe<HTMLButtonElement>('#submit-answer-btn');
        this.feedbackSection = this.getElementSafe<HTMLElement>('#feedback-section');
        this.feedbackText = this.getElementSafe<HTMLElement>('#feedback-text');
        this.nextQuestionButton = this.getElementSafe<HTMLButtonElement>('#next-question-btn');
        this.streakNumber = this.getElementSafe<SVGTextElement>('.streak-number');
        this.streakDisplay = this.getElementSafe<HTMLElement>('.streak-display');

        this.setupEventListeners();
        this.loadQuestion();
        this.loadUserStreak();
    }

    private setupEventListeners(): void {
        this.attachEvent(this.submitButton, 'click', () => this.handleSubmitAnswer());
        this.attachEvent(this.nextQuestionButton, 'click', () => this.loadQuestion());
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
        // Prevent concurrent question loading
        if (this.isLoadingQuestion) {
            console.log('Already loading a question, ignoring duplicate request');
            return;
        }

        // Set loading flag and disable button immediately
        this.isLoadingQuestion = true;
        this.nextQuestionButton.disabled = true;

        try {
            // Reset UI
            this.addClass(this.feedbackSection, 'hidden');
            this.removeClass(this.feedbackSection, 'correct');
            this.removeClass(this.feedbackSection, 'partial');
            this.removeClass(this.feedbackSection, 'incorrect');

            this.answerInput.value = '';
            this.answerInput.disabled = false;
            this.tamagotchi.setEmotion('neutral');

            // Load new question
            const newQuestion = await api.getRandomQuestion();

            // Only update currentQuestion after successful load
            // This ensures currentQuestion always matches what's on screen
            this.currentQuestion = newQuestion;
            this.setTextContent(this.questionText, this.currentQuestion.text);

            // Re-enable submit button only after question is loaded
            this.submitButton.disabled = false;
        } catch (error) {
            this.setTextContent(this.questionText, 'Error al cargar la pregunta. Por favor, intenta de nuevo.');
            // Re-enable submit button even on error
            this.submitButton.disabled = false;
        } finally {
            // Always reset loading flag
            this.isLoadingQuestion = false;
        }
        // Note: nextQuestionButton stays disabled until user submits an answer
    }

    private async handleSubmitAnswer(): Promise<void> {
        if (!this.currentQuestion) {
            return;
        }

        const userAnswer = this.answerInput.value.trim();
        if (!userAnswer) {
            alert('Por favor, escribe una respuesta');
            return;
        }

        // Disable input while processing
        this.answerInput.disabled = true;
        this.submitButton.disabled = true;
        this.setTextContent(this.submitButton, 'Validando...');

        try {
            const result = await api.submitAnswer(
                this.currentQuestion._id,
                this.currentQuestion.text,
                userAnswer
            );

            // Update streak
            this.currentStreak = result.newStreak;
            this.updateStreakDisplay(result.newStreak);

            // Update Tamagotchi emotion
            if (result.rating === 'correct') {
                this.tamagotchi.setEmotion('happy');
                this.addClass(this.feedbackSection, 'correct');
            } else if (result.rating === 'partial') {
                this.tamagotchi.setEmotion('neutral');
                this.addClass(this.feedbackSection, 'partial');
            } else {
                this.tamagotchi.setEmotion('sad');
                this.addClass(this.feedbackSection, 'incorrect');
            }

            // Show feedback
            this.setTextContent(this.feedbackText, result.feedback);
            this.removeClass(this.feedbackSection, 'hidden');
            this.setTextContent(this.submitButton, 'Enviar Respuesta');

            // Enable next question button after feedback is shown
            this.nextQuestionButton.disabled = false;
            // Keep submit button disabled to prevent resubmission
        } catch (error) {
            alert('Error al enviar la respuesta. Por favor, intenta de nuevo.');
            this.answerInput.disabled = false;
            this.submitButton.disabled = false;
            this.setTextContent(this.submitButton, 'Enviar Respuesta');
        }
    }

    private updateStreakDisplay(streak: number): void {
        this.streakNumber.textContent = streak.toString();

        // Add animation
        this.removeClass(this.streakDisplay, 'streak-updated');
        // Force reflow to restart animation
        void this.streakDisplay.offsetWidth;
        this.addClass(this.streakDisplay, 'streak-updated');
    }
}
