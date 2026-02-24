import { api, Answer } from '../api';
import { DOMManager } from '../dom-manager';

export class ProfileView extends DOMManager {
    private profileEmail: HTMLElement;
    private profileStreak: HTMLElement;
    private historyContainer: HTMLElement;
    private passwordForm: HTMLFormElement;
    private currentPasswordInput: HTMLInputElement;
    private newPasswordInput: HTMLInputElement;
    private confirmPasswordInput: HTMLInputElement;
    private passwordSection: HTMLElement;
    private targetUserId: string | null = null;

    constructor() {
        super();
        this.profileEmail = this.getElementSafe<HTMLElement>('#profile-email');
        this.profileStreak = this.getElementSafe<HTMLElement>('#profile-streak');
        this.historyContainer = this.getElementSafe<HTMLElement>('#history-container');
        this.passwordForm = this.getElementSafe<HTMLFormElement>('#password-form');
        this.currentPasswordInput = this.getElementSafe<HTMLInputElement>('#current-password');
        this.newPasswordInput = this.getElementSafe<HTMLInputElement>('#new-password');
        this.confirmPasswordInput = this.getElementSafe<HTMLInputElement>('#confirm-password');
        this.passwordSection = this.getElementSafe<HTMLElement>('#password-change-section');

        this.setupEventListeners();
        this.loadProfile();
        this.loadHistory();
    }

    private setupEventListeners(): void {
        this.passwordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
    }

    private async handlePasswordSubmit(e: Event): Promise<void> {
        e.preventDefault();
        const currentPassword = this.currentPasswordInput.value;
        const newPassword = this.newPasswordInput.value;
        const confirm = this.confirmPasswordInput.value;

        if (newPassword !== confirm) {
            alert('Las contraseñas no coinciden');
            return;
        }

        try {
            await api.updateProfilePassword(currentPassword, newPassword);
            alert('Contraseña actualizada con éxito');
            this.passwordForm.reset();
        } catch (error) {
            alert('Error al actualizar la contraseña: ' + (error as Error).message);
        }
    }

    public setParams(params: Record<string, string>): void {
        if (params.id) {
            this.targetUserId = params.id;
            this.refresh();
        }
    }

    destroy(): void {
        super.destroy();
    }

    private async loadProfile(): Promise<void> {
        try {
            const profile = await api.getProfile(this.targetUserId || undefined);
            this.setTextContent(this.profileEmail, profile.email);
            this.setTextContent(this.profileStreak, profile.streak.toString());

            // Solo mostrar el formulario de cambio de contraseña si es el perfil propio
            if (this.targetUserId) {
                this.passwordSection.classList.add('hidden');
            } else {
                this.passwordSection.classList.remove('hidden');
            }
        } catch (error) {
            this.setTextContent(this.profileEmail, 'Error');
            this.setTextContent(this.profileStreak, '0');
        }
    }

    private async loadHistory(): Promise<void> {
        try {
            const history = await api.getHistory(50, this.targetUserId || undefined);
            this.renderHistory(history);
        } catch (error) {
            this.clearContainer(this.historyContainer);
            this.appendToContainer(
                this.historyContainer,
                this.createElement('p', { class: 'loading' }, 'Error al cargar el historial')
            );
        }
    }

    private renderHistory(history: Answer[]): void {
        this.clearContainer(this.historyContainer);

        if (history.length === 0) {
            this.appendToContainer(
                this.historyContainer,
                this.createElement('p', { class: 'loading' }, 'No hay respuestas todavía')
            );
            return;
        }

        history.forEach((answer) => {
            const item = this.createElement('div', { class: `history-item ${answer.rating}` });

            const header = this.createElement('div', { class: 'history-item-header' });

            const rating = this.createElement('span', { class: `history-rating ${answer.rating}` }, this.getRatingLabel(answer.rating));

            const timestamp = this.createElement('span', { class: 'history-timestamp' }, this.formatDate(answer.timestamp));

            this.appendToContainer(header, rating);
            this.appendToContainer(header, timestamp);

            const question = this.createElement('div', { class: 'history-question' }, answer.questionText);

            const userAnswer = this.createElement('div', { class: 'history-answer' }, `Tu respuesta: ${answer.userAnswer}`);

            const feedback = this.createElement('div', { class: 'history-feedback' }, answer.feedback);

            this.appendToContainer(item, header);
            this.appendToContainer(item, question);
            this.appendToContainer(item, userAnswer);
            this.appendToContainer(item, feedback);

            this.appendToContainer(this.historyContainer, item);
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
