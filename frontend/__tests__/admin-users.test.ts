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
        const mockUsers = [
            {
                _id: 'u1',
                email: 'admin@test.com',
                role: 'PROFESSOR' as const,
                streak: 10,
                commission: 'MAÑANA' as const,
                currentQuestionText: 'Pregunta de prueba',
                lastQuestionAssignedAt: new Date().toISOString(),
                currentQuestionId: null,
                createdAt: new Date().toISOString(),
            },
        ] as (apiModule.User & { currentQuestionText: string })[];

        const usersSpy = jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue(mockUsers);

        new AdminUsersView();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(usersSpy).toHaveBeenCalledTimes(1);
        const tableBody = document.getElementById('users-table-body');
        expect(tableBody?.textContent).toContain('admin@test.com');
        expect(tableBody?.textContent).toContain('Pregunta de prueba');
        expect(tableBody?.textContent).toContain('MAÑANA');
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
        const commissionInput = document.getElementById('user-commission') as HTMLSelectElement;
        commissionInput.value = 'NOCHE';

        const form = document.getElementById('user-form');
        form?.dispatchEvent(new Event('submit'));

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
            email: 'new@test.com',
            role: 'STUDENT',
            password: 'pass123',
            commission: 'NOCHE',
        }));
    });

    it('deberia mostrar el modal de confirmacion al eliminar', async () => {
        const mockUser = { _id: 'u1', email: 'delete@test.com', role: 'STUDENT' as const, streak: 0, currentQuestionText: '' } as (apiModule.User & { currentQuestionText: string });
        jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue([mockUser]);

        new AdminUsersView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const deleteBtn = document.querySelector('.btn-icon.delete') as HTMLButtonElement;
        deleteBtn?.click();

        const deleteModal = document.getElementById('delete-modal');
        expect(deleteModal?.classList.contains('hidden')).toBe(false);
        expect(document.getElementById('delete-user-email')?.textContent).toBe('delete@test.com');
    });

    it('deberia filtrar usuarios por texto ignorando mayusculas y tildes cuando se escribe en el campo de busqueda', async () => {
        const mockUsers = [
            { _id: 'u1', email: 'quequeque@test.com', role: 'STUDENT' as const, streak: 0, currentQuestionText: '', currentQuestionId: null, createdAt: '', lastQuestionAssignedAt: null },
            { _id: 'u2', email: 'otrouser@test.com', role: 'STUDENT' as const, streak: 0, currentQuestionText: '', currentQuestionId: null, createdAt: '', lastQuestionAssignedAt: null },
        ] as (apiModule.User & { currentQuestionText: string })[];
        jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue(mockUsers);

        new AdminUsersView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const filterInput = document.getElementById('user-filter-text') as HTMLInputElement;
        filterInput.value = 'QUÉ';
        filterInput.dispatchEvent(new Event('input'));

        const tableBody = document.getElementById('users-table-body');
        expect(tableBody?.textContent).toContain('quequeque@test.com');
        expect(tableBody?.textContent).not.toContain('otrouser@test.com');
    });

    it('deberia mostrar solo usuarios de la comision manana cuando se selecciona la pestana manana', async () => {
        const mockUsers = [
            { _id: 'u1', email: 'manana@test.com', role: 'STUDENT' as const, streak: 0, commission: 'MAÑANA' as const, currentQuestionText: '', currentQuestionId: null, createdAt: '', lastQuestionAssignedAt: null },
            { _id: 'u2', email: 'noche@test.com', role: 'STUDENT' as const, streak: 0, commission: 'NOCHE' as const, currentQuestionText: '', currentQuestionId: null, createdAt: '', lastQuestionAssignedAt: null },
            { _id: 'u3', email: 'sin@test.com', role: 'PROFESSOR' as const, streak: 0, currentQuestionText: '', currentQuestionId: null, createdAt: '', lastQuestionAssignedAt: null },
        ] as (apiModule.User & { currentQuestionText: string })[];
        jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue(mockUsers);

        new AdminUsersView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const tabManana = document.getElementById('tab-manana') as HTMLButtonElement;
        tabManana.click();

        const tableBody = document.getElementById('users-table-body');
        expect(tableBody?.textContent).toContain('manana@test.com');
        expect(tableBody?.textContent).not.toContain('noche@test.com');
        expect(tableBody?.textContent).not.toContain('sin@test.com');
    });

    it('deberia mostrar solo usuarios de la comision noche cuando se selecciona la pestana noche', async () => {
        const mockUsers = [
            { _id: 'u1', email: 'manana@test.com', role: 'STUDENT' as const, streak: 0, commission: 'MAÑANA' as const, currentQuestionText: '', currentQuestionId: null, createdAt: '', lastQuestionAssignedAt: null },
            { _id: 'u2', email: 'noche@test.com', role: 'STUDENT' as const, streak: 0, commission: 'NOCHE' as const, currentQuestionText: '', currentQuestionId: null, createdAt: '', lastQuestionAssignedAt: null },
        ] as (apiModule.User & { currentQuestionText: string })[];
        jest.spyOn(apiModule.api, 'getAllUsers').mockResolvedValue(mockUsers);

        new AdminUsersView();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const tabNoche = document.getElementById('tab-noche') as HTMLButtonElement;
        tabNoche.click();

        const tableBody = document.getElementById('users-table-body');
        expect(tableBody?.textContent).toContain('noche@test.com');
        expect(tableBody?.textContent).not.toContain('manana@test.com');
    });
});
