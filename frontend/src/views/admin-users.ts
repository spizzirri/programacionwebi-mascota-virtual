import { api, User } from '../api';
import { DOMManager } from '../dom-manager';

export class AdminUsersView extends DOMManager {
    private tableBody: HTMLElement;
    private userModal: HTMLElement;
    private deleteModal: HTMLElement;
    private userForm: HTMLFormElement;
    private userIdInput: HTMLInputElement;
    private userEmailInput: HTMLInputElement;
    private userPasswordInput: HTMLInputElement;
    private userRoleInput: HTMLSelectElement;
    private modalTitle: HTMLElement;
    private deleteUserEmailText: HTMLElement;
    private currentDeleteId: string | null = null;
    private users: (User & { currentQuestionText: string })[] = [];

    constructor() {
        super();
        this.tableBody = this.getElementSafe<HTMLElement>('#users-table-body');
        this.userModal = this.getElementSafe<HTMLElement>('#user-modal');
        this.deleteModal = this.getElementSafe<HTMLElement>('#delete-modal');
        this.userForm = this.getElementSafe<HTMLFormElement>('#user-form');
        this.userIdInput = this.getElementSafe<HTMLInputElement>('#user-id');
        this.userEmailInput = this.getElementSafe<HTMLInputElement>('#user-email');
        this.userPasswordInput = this.getElementSafe<HTMLInputElement>('#user-password');
        this.userRoleInput = this.getElementSafe<HTMLSelectElement>('#user-role');
        this.modalTitle = this.getElementSafe<HTMLElement>('#modal-title');
        this.deleteUserEmailText = this.getElementSafe<HTMLElement>('#delete-user-email');

        this.setupEventListeners();
        this.loadUsers();
    }

    private setupEventListeners(): void {
        this.getElementSafe('#add-user-btn').addEventListener('click', () => this.openUserModal());
        this.getElementSafe('#close-modal').addEventListener('click', () => this.closeUserModal());
        this.getElementSafe('#close-delete-modal').addEventListener('click', () => this.closeDeleteModal());
        this.getElementSafe('#confirm-delete').addEventListener('click', () => this.handleDeleteUser());

        this.userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));

        // Close modals on background click
        [this.userModal, this.deleteModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeUserModal();
                    this.closeDeleteModal();
                }
            });
        });
    }

    destroy(): void {
        super.destroy();
    }

    private async loadUsers(): Promise<void> {
        try {
            this.users = await api.getAllUsers();
            this.renderUsers(this.users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.clearContainer(this.tableBody);
            const row = this.createElement('tr');
            const cell = this.createElement('td', { colspan: '6', class: 'loading' }, 'Error al cargar los usuarios');
            this.appendToContainer(row, cell);
            this.appendToContainer(this.tableBody, row);
        }
    }

    private renderUsers(users: (User & { currentQuestionText: string })[]): void {
        this.clearContainer(this.tableBody);

        if (users.length === 0) {
            const row = this.createElement('tr');
            const cell = this.createElement('td', { colspan: '6', class: 'loading' }, 'No hay usuarios registrados');
            this.appendToContainer(row, cell);
            this.appendToContainer(this.tableBody, row);
            return;
        }

        users.forEach((user) => {
            const row = this.createElement('tr');

            const emailCell = this.createElement('td', {}, user.email);
            const roleCell = this.createElement('td', {}, user.role);
            const streakCell = this.createElement('td', {}, user.streak.toString());
            const questionCell = this.createElement('td', {}, user.currentQuestionText || '-');
            const dateCell = this.createElement('td', {}, user.lastQuestionAssignedAt ? this.formatDate(user.lastQuestionAssignedAt) : '-');

            const actionsCell = this.createElement('td');
            const actionsContainer = this.createElement('div', { class: 'action-buttons' });

            const editBtn = this.createElement('button', { class: 'btn-icon', title: 'Modificar' }, '✏️');
            editBtn.addEventListener('click', () => this.openUserModal(user));

            const deleteBtn = this.createElement('button', { class: 'btn-icon delete', title: 'Eliminar' }, '🗑️');
            deleteBtn.addEventListener('click', () => this.openDeleteModal(user));

            const profileBtn = this.createElement('button', { class: 'btn-icon', title: 'Ver Perfil' }, '👤');
            profileBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate-to', {
                    detail: { view: `/profile/${user._id}` }
                }));
            });

            this.appendToContainer(actionsContainer, profileBtn);
            this.appendToContainer(actionsContainer, editBtn);
            this.appendToContainer(actionsContainer, deleteBtn);
            this.appendToContainer(actionsCell, actionsContainer);

            this.appendToContainer(row, emailCell);
            this.appendToContainer(row, roleCell);
            this.appendToContainer(row, streakCell);
            this.appendToContainer(row, questionCell);
            this.appendToContainer(row, dateCell);
            this.appendToContainer(row, actionsCell);

            this.appendToContainer(this.tableBody, row);
        });
    }

    private openUserModal(user?: User): void {
        this.userForm.reset();
        if (user) {
            this.modalTitle.textContent = 'Modificar Usuario';
            this.userIdInput.value = user._id;
            this.userEmailInput.value = user.email;
            this.userRoleInput.value = user.role;
            this.userPasswordInput.placeholder = '•••••••• (dejar vacío para no cambiar)';
            this.userPasswordInput.required = false;
        } else {
            this.modalTitle.textContent = 'Agregar Usuario';
            this.userIdInput.value = '';
            this.userPasswordInput.placeholder = '••••••••';
            this.userPasswordInput.required = true;
        }
        this.userModal.classList.remove('hidden');
    }

    private closeUserModal(): void {
        this.userModal.classList.add('hidden');
    }

    private async handleUserSubmit(e: Event): Promise<void> {
        e.preventDefault();
        const id = this.userIdInput.value;
        const userData: any = {
            email: this.userEmailInput.value,
            role: this.userRoleInput.value,
        };

        if (this.userPasswordInput.value) {
            userData.password = this.userPasswordInput.value;
        }

        try {
            if (id) {
                await api.updateUser(id, userData);
            } else {
                await api.createUser(userData);
            }
            this.closeUserModal();
            this.loadUsers();
        } catch (error) {
            alert('Error al guardar el usuario: ' + (error as Error).message);
        }
    }

    private openDeleteModal(user: User): void {
        this.currentDeleteId = user._id;
        this.deleteUserEmailText.textContent = user.email;
        this.deleteModal.classList.remove('hidden');
    }

    private closeDeleteModal(): void {
        this.deleteModal.classList.add('hidden');
        this.currentDeleteId = null;
    }

    private async handleDeleteUser(): Promise<void> {
        if (!this.currentDeleteId) return;

        try {
            await api.deleteUser(this.currentDeleteId);
            this.closeDeleteModal();
            this.loadUsers();
        } catch (error) {
            alert('Error al eliminar el usuario: ' + (error as Error).message);
        }
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    refresh(): void {
        this.loadUsers();
    }
}
