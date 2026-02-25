import { api, Appeal } from '../api';
import { DOMManager } from '../dom-manager';

export class MyAppealsView extends DOMManager {
    private tableBody: HTMLElement;

    constructor() {
        super();
        this.tableBody = this.getElementSafe<HTMLElement>('#appeals-table-body');
        this.loadAppeals();
    }

    private async loadAppeals(): Promise<void> {
        try {
            const appeals = await api.getMyAppeals();
            this.renderAppeals(appeals);
        } catch (error) {
            this.showAlert('Error al cargar tus apelaciones.');
        }
    }

    private renderAppeals(appeals: Appeal[]): void {
        this.tableBody.innerHTML = '';

        if (appeals.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No tienes apelaciones registradas.</td></tr>';
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
                <td title="${appeal.questionText}">${this.truncate(appeal.questionText, 50)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${appeal.professorFeedback || '-'}</td>
            `;
            this.tableBody.appendChild(tr);
        });
    }

    private truncate(text: string, limit: number): string {
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }
}
