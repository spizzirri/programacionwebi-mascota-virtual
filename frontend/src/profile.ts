// Profile and history page logic

import { api, Answer } from './api';

export class ProfileManager {
    private profileEmail: HTMLElement;
    private profileStreak: HTMLElement;
    private historyContainer: HTMLElement;

    constructor() {
        this.profileEmail = document.getElementById('profile-email') as HTMLElement;
        this.profileStreak = document.getElementById('profile-streak') as HTMLElement;
        this.historyContainer = document.getElementById('history-container') as HTMLElement;

        this.loadProfile();
        this.loadHistory();
    }

    private async loadProfile(): Promise<void> {
        try {
            const profile = await api.getProfile();
            this.profileEmail.textContent = profile.email;
            this.profileStreak.textContent = profile.streak.toString();
        } catch (error) {
            this.profileEmail.textContent = 'Error';
            this.profileStreak.textContent = '0';
        }
    }

    private async loadHistory(): Promise<void> {
        try {
            const history = await api.getHistory(50);
            this.renderHistory(history);
        } catch (error) {
            this.historyContainer.innerHTML = '<p class="loading">Error al cargar el historial</p>';
        }
    }

    private renderHistory(history: Answer[]): void {
        if (history.length === 0) {
            this.historyContainer.innerHTML = '<p class="loading">No hay respuestas todavía</p>';
            return;
        }

        this.historyContainer.innerHTML = '';

        history.forEach((answer) => {
            const item = document.createElement('div');
            item.className = `history-item ${answer.rating}`;

            const header = document.createElement('div');
            header.className = 'history-item-header';

            const rating = document.createElement('span');
            rating.className = `history-rating ${answer.rating}`;
            rating.textContent = this.getRatingLabel(answer.rating);

            const timestamp = document.createElement('span');
            timestamp.className = 'history-timestamp';
            timestamp.textContent = this.formatDate(answer.timestamp);

            header.appendChild(rating);
            header.appendChild(timestamp);

            const question = document.createElement('div');
            question.className = 'history-question';
            question.textContent = answer.questionText;

            const userAnswer = document.createElement('div');
            userAnswer.className = 'history-answer';
            userAnswer.textContent = `Tu respuesta: ${answer.userAnswer}`;

            const feedback = document.createElement('div');
            feedback.className = 'history-feedback';
            feedback.textContent = answer.feedback;

            item.appendChild(header);
            item.appendChild(question);
            item.appendChild(userAnswer);
            item.appendChild(feedback);

            this.historyContainer.appendChild(item);
        });
    }

    private getRatingLabel(rating: string): string {
        switch (rating) {
            case 'correct':
                return 'Correcta';
            case 'partial':
                return 'Parcial';
            case 'incorrect':
                return 'Incorrecta';
            default:
                return rating;
        }
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Hace un momento';
        } else if (diffMins < 60) {
            return `Hace ${diffMins} min`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours}h`;
        } else if (diffDays < 7) {
            return `Hace ${diffDays}d`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            });
        }
    }

    refresh(): void {
        this.loadProfile();
        this.loadHistory();
    }
}
