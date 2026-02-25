import { api, Appeal } from '../api';
import { DOMManager } from '../dom-manager';

export class AdminAppealsView extends DOMManager {
    private tableBody: HTMLElement;
    private modal: HTMLElement;
    private currentAppeal: Appeal | null = null;

    constructor() {
        super();
        this.tableBody = this.getElementSafe<HTMLElement>('#admin-appeals-table-body');
        this.modal = this.getElementSafe<HTMLElement>('#appeal-modal');

        this.setupEventListeners();
        this.loadAppeals();
    }

    private setupEventListeners(): void {
        this.attachEvent(this.modal, 'click', (e: MouseEvent) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        this.attachEvent(this.getElementSafe('#accept-appeal-btn'), 'click', () => this.handleResolve('accepted'));
        this.attachEvent(this.getElementSafe('#reject-appeal-btn'), 'click', () => this.handleResolve('rejected'));
    }

    private async loadAppeals(): Promise<void> {
        try {
            const appeals = await api.getAllAppeals();
            this.renderAppeals(appeals);
        } catch (error) {
            this.showAlert('Error al cargar las apelaciones.');
        }
    }

    private renderAppeals(appeals: Appeal[]): void {
        this.tableBody.innerHTML = '';

        if (appeals.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay apelaciones pendientes.</td></tr>';
            return;
        }

        appeals.forEach(appeal => {
            const tr = document.createElement('tr');
            if (appeal.status !== 'pending') {
                this.addClass(tr, 'resolved-row');
            }

            const date = new Date(appeal.createdAt).toLocaleDateString();
            const statusClass = `history-rating ${appeal.status}`;
            const statusText = appeal.status === 'pending' ? 'Pendiente' :
                appeal.status === 'accepted' ? 'Aceptada' : 'Rechazada';

            tr.innerHTML = `
                <td>${date}</td>
                <td>${appeal.userName}</td>
                <td title="${appeal.questionText}">${this.truncate(appeal.questionText, 40)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td><button class="btn-icon view-appeal-btn" data-id="${appeal._id}">Ver</button></td>
            `;

            const viewBtn = tr.querySelector('.view-appeal-btn') as HTMLButtonElement;
            this.attachEvent(viewBtn, 'click', () => this.openModal(appeal));

            this.tableBody.appendChild(tr);
        });
    }

    private openModal(appeal: Appeal): void {
        this.currentAppeal = appeal;
        this.getElementSafe('#detail-student').textContent = appeal.userName;
        this.getElementSafe('#detail-question').textContent = appeal.questionText;
        this.getElementSafe('#detail-answer').textContent = appeal.userAnswer;
        this.getElementSafe('#detail-rating').textContent = appeal.originalRating;
        this.getElementSafe('#detail-original-feedback').textContent = appeal.originalFeedback;
        (this.getElementSafe('#professor-feedback') as HTMLTextAreaElement).value = appeal.professorFeedback || '';

        const actions = this.getElementSafe<HTMLElement>('.modal-actions');
        if (appeal.status !== 'pending') {
            this.addClass(actions, 'hidden');
            (this.getElementSafe('#professor-feedback') as HTMLTextAreaElement).disabled = true;
        } else {
            this.removeClass(actions, 'hidden');
            (this.getElementSafe('#professor-feedback') as HTMLTextAreaElement).disabled = false;
        }

        this.removeClass(this.modal, 'hidden');
    }

    private closeModal(): void {
        this.addClass(this.modal, 'hidden');
        this.currentAppeal = null;
    }

    private async handleResolve(status: 'accepted' | 'rejected'): Promise<void> {
        if (!this.currentAppeal) return;

        const feedback = (this.getElementSafe('#professor-feedback') as HTMLTextAreaElement).value.trim();
        if (!feedback) {
            this.showAlert('Por favor, proporciona feedback.');
            return;
        }

        try {
            await api.resolveAppeal(this.currentAppeal._id, status, feedback);
            await this.showAlert(`Apelación ${status === 'accepted' ? 'aceptada' : 'rechazada'} correctamente.`);
            this.closeModal();
            this.loadAppeals();
        } catch (error) {
            this.showAlert('Error al resolver la apelación.');
        }
    }

    private truncate(text: string, limit: number): string {
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }
}
