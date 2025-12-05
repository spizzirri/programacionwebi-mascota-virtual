// Game logic - questions, answers, and Tamagotchi interaction

import { api, Question } from './api';
import { Tamagotchi } from './tamagotchi';

export class GameManager {
    private tamagotchi: Tamagotchi;
    private currentQuestion: Question | null = null;
    private currentStreak: number = 0;

    private questionText: HTMLElement;
    private answerInput: HTMLTextAreaElement;
    private submitButton: HTMLButtonElement;
    private feedbackSection: HTMLElement;
    private feedbackText: HTMLElement;
    private nextQuestionButton: HTMLButtonElement;
    private streakNumber: SVGTextElement;
    private streakDisplay: HTMLElement;

    constructor() {
        this.tamagotchi = new Tamagotchi('tamagotchi-container');

        this.questionText = document.getElementById('question-text') as HTMLElement;
        this.answerInput = document.getElementById('answer-input') as HTMLTextAreaElement;
        this.submitButton = document.getElementById('submit-answer-btn') as HTMLButtonElement;
        this.feedbackSection = document.getElementById('feedback-section') as HTMLElement;
        this.feedbackText = document.getElementById('feedback-text') as HTMLElement;
        this.nextQuestionButton = document.getElementById('next-question-btn') as HTMLButtonElement;
        this.streakNumber = document.querySelector('.streak-number') as SVGTextElement;
        this.streakDisplay = document.querySelector('.streak-display') as HTMLElement;

        this.setupEventListeners();
        this.loadQuestion();
        this.loadUserStreak();
    }

    private setupEventListeners(): void {
        this.submitButton.addEventListener('click', () => this.handleSubmitAnswer());
        this.nextQuestionButton.addEventListener('click', () => this.loadQuestion());
    }

    private async loadUserStreak(): Promise<void> {
        try {
            const profile = await api.getProfile();
            this.currentStreak = profile.streak;
            this.updateStreakDisplay(this.currentStreak);
        } catch (error) {
            console.error('Error loading user streak:', error);
        }
    }

    private async loadQuestion(): Promise<void> {
        this.nextQuestionButton.disabled = true;
        try {
            // Reset UI
            this.feedbackSection.classList.add('hidden');
            this.feedbackSection.classList.remove('correct', 'partial', 'incorrect');
            this.answerInput.value = '';
            this.answerInput.disabled = false;
            this.submitButton.disabled = false;
            this.tamagotchi.setEmotion('neutral');

            // Load new question
            this.currentQuestion = await api.getRandomQuestion();
            this.questionText.textContent = this.currentQuestion.text;
        } catch (error) {
            console.error('Error loading question:', error);
            this.questionText.textContent = 'Error al cargar la pregunta. Por favor, intenta de nuevo.';
        } finally {
            this.nextQuestionButton.disabled = false;
        }
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
        this.submitButton.textContent = 'Validando...';

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
                this.feedbackSection.classList.add('correct');
            } else if (result.rating === 'partial') {
                this.tamagotchi.setEmotion('neutral');
                this.feedbackSection.classList.add('partial');
            } else {
                this.tamagotchi.setEmotion('sad');
                this.feedbackSection.classList.add('incorrect');
            }

            // Show feedback
            this.feedbackText.textContent = result.feedback;
            this.feedbackSection.classList.remove('hidden');
            this.submitButton.textContent = 'Enviar Respuesta';
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Error al enviar la respuesta. Por favor, intenta de nuevo.');
            this.answerInput.disabled = false;
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Enviar Respuesta';
        }
    }

    private updateStreakDisplay(streak: number): void {
        this.streakNumber.textContent = streak.toString();

        // Add animation
        this.streakDisplay.classList.remove('streak-updated');
        // Force reflow to restart animation
        void this.streakDisplay.offsetWidth;
        this.streakDisplay.classList.add('streak-updated');
    }
}
