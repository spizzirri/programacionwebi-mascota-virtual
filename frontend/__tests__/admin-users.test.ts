import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { AdminUsersView } from '../src/views/admin-users';
import * as apiModule from '../src/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AdminUsersView', () => {
    beforeEach(() => {
        const htmlPath = path.resolve(__dirname, '../src/views/admin-users.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        document.body.innerHTML = htmlContent;
        jest.clearAllMocks();
    });

    it('deberia cargar y renderizar los usuarios al iniciar', async () => {
        const mockUsers: any[] = [
            {
                _id: 'u1',
                email: 'admin@test.com',
                role: 'PROFESSOR',
                streak: 10,
                currentQuestionText: 'Pregunta de prueba',
                lastQuestionAssignedAt: new Date().toISOString(),
            },
        ];

        const usersSpy = jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue(mockUsers);

        new AdminUsersView();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(usersSpy).toHaveBeenCalledTimes(1);
        const tableBody = document.getElementById('users-table-body');
        expect(tableBody?.textContent).toContain('admin@test.com');
        expect(tableBody?.textContent).toContain('Pregunta de prueba');
        expect(document.querySelectorAll('.action-buttons .btn-icon').length).toBe(3);
    });

    it('deberia abrir el modal al hacer clic en agregar usuario', async () => {
        new AdminUsersView();
        const addBtn = document.getElementById('add-user-btn');
        addBtn?.click();

        const modal = document.getElementById('user-modal');
        expect(modal?.classList.contains('hidden')).toBe(false);
        expect(document.getElementById('modal-title')?.textContent).toBe('Agregar Usuario');
    });

    it('deberia llamar a api.createUser al enviar el formulario de nuevo usuario', async () => {
        const createSpy = jest.spyOn(apiModule.api, 'createUser').mockResolvedValue({} as any);
        jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue([]);

        const view = new AdminUsersView();
        (view as any).openUserModal();

        const emailInput = document.getElementById('user-email') as HTMLInputElement;
        emailInput.value = 'new@test.com';
        const roleInput = document.getElementById('user-role') as HTMLSelectElement;
        roleInput.value = 'STUDENT';
        const passwordInput = document.getElementById('user-password') as HTMLInputElement;
        passwordInput.value = 'pass123';

        const form = document.getElementById('user-form');
        form?.dispatchEvent(new Event('submit'));

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(createSpy).toHaveBeenCalledWith({
            email: 'new@test.com',
            role: 'STUDENT',
            password: 'pass123'
        });
    });

    it('deberia mostrar el modal de confirmacion al eliminar', async () => {
        const mockUser = { _id: 'u1', email: 'delete@test.com', role: 'STUDENT', streak: 0, currentQuestionText: '' };
        jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue([mockUser] as any);

        new AdminUsersView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const deleteBtn = document.querySelector('.btn-icon.delete') as HTMLButtonElement;
        deleteBtn?.click();

        const deleteModal = document.getElementById('delete-modal');
        expect(deleteModal?.classList.contains('hidden')).toBe(false);
        expect(document.getElementById('delete-user-email')?.textContent).toBe('delete@test.com');
    });
});
