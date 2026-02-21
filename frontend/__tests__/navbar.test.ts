import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AppNavbar } from '../src/web-components/navbar';
import { session } from '../src/session';
import * as apiModule from '../src/api';

describe('AppNavbar', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const renderNavbar = (view: string) => {
        const navbar = new AppNavbar();
        navbar.setAttribute('view', view);
        document.body.appendChild(navbar);
        return navbar;
    };

    it('deberia mostrar botones Volver al Juego y Administrador para el rol PROFESSOR en la vista profile', () => {
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '1',
            email: 'admin@test.com',
            role: 'PROFESSOR',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });

        renderNavbar('profile');

        const adminBtn = document.getElementById('admin-nav-btn') as HTMLButtonElement;
        const profileBtn = document.getElementById('profile-nav-btn') as HTMLButtonElement;
        const gameBtn = document.getElementById('game-nav-btn') as HTMLButtonElement;

        expect(adminBtn).not.toBeNull();
        expect(profileBtn).not.toBeNull();
        expect(gameBtn).not.toBeNull();

        expect(adminBtn.disabled).toBe(false);
        expect(profileBtn.disabled).toBe(true); // Está en la vista profile
        expect(gameBtn.disabled).toBe(false);
    });

    it('deberia mostrar botones Mi Perfil y Administrador para el rol PROFESSOR en la vista game', () => {
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '1',
            email: 'admin@test.com',
            role: 'PROFESSOR',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });

        renderNavbar('game');

        const adminBtn = document.getElementById('admin-nav-btn') as HTMLButtonElement;
        const profileBtn = document.getElementById('profile-nav-btn') as HTMLButtonElement;
        const gameBtn = document.getElementById('game-nav-btn') as HTMLButtonElement;

        expect(adminBtn).not.toBeNull();
        expect(profileBtn).not.toBeNull();
        expect(gameBtn).not.toBeNull();

        expect(adminBtn.disabled).toBe(false);
        expect(profileBtn.disabled).toBe(false);
        expect(gameBtn.disabled).toBe(true); // Está en la vista game
    });

    it('deberia mostrar botones Mi Perfil y Volver al Juego para el rol PROFESSOR en la vista admin', () => {
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '1',
            email: 'admin@test.com',
            role: 'PROFESSOR',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });

        renderNavbar('admin');

        const adminBtn = document.getElementById('admin-nav-btn') as HTMLButtonElement;
        const profileBtn = document.getElementById('profile-nav-btn') as HTMLButtonElement;
        const gameBtn = document.getElementById('game-nav-btn') as HTMLButtonElement;

        expect(adminBtn).not.toBeNull();
        expect(profileBtn).not.toBeNull();
        expect(gameBtn).not.toBeNull();

        expect(adminBtn.disabled).toBe(true); // Está en la vista admin
        expect(profileBtn.disabled).toBe(false);
        expect(gameBtn.disabled).toBe(false);
    });

    it('deberia mostrar solo boton Mi Perfil para el rol STUDENT en la vista game', () => {
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '2',
            email: 'student@test.com',
            role: 'STUDENT',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });

        renderNavbar('game');

        const adminBtn = document.getElementById('admin-nav-btn');
        const profileBtn = document.getElementById('profile-nav-btn');
        const gameBtn = document.getElementById('game-nav-btn');
        const actionBtn = document.getElementById('nav-action-btn') as HTMLButtonElement;

        expect(adminBtn).toBeNull();
        expect(profileBtn).toBeNull();
        expect(gameBtn).toBeNull();
        expect(actionBtn).not.toBeNull();
        expect(actionBtn.textContent).toBe('Mi Perfil');
    });

    it('deberia mostrar solo boton Volver al Juego para el rol STUDENT en la vista profile', () => {
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '2',
            email: 'student@test.com',
            role: 'STUDENT',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });

        renderNavbar('profile');

        const adminBtn = document.getElementById('admin-nav-btn');
        const profileBtn = document.getElementById('profile-nav-btn');
        const gameBtn = document.getElementById('game-nav-btn');
        const actionBtn = document.getElementById('nav-action-btn') as HTMLButtonElement;

        expect(adminBtn).toBeNull();
        expect(profileBtn).toBeNull();
        expect(gameBtn).toBeNull();
        expect(actionBtn).not.toBeNull();
        expect(actionBtn.textContent).toBe('Volver al Juego');
    });

    it('deberia despachar evento navigate-to al hacer click en los botones del PROFESSOR', () => {
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '1',
            email: 'admin@test.com',
            role: 'PROFESSOR',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });

        renderNavbar('game');

        const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

        const adminBtn = document.getElementById('admin-nav-btn') as HTMLButtonElement;
        const profileBtn = document.getElementById('profile-nav-btn') as HTMLButtonElement;

        adminBtn.click();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        expect((dispatchSpy.mock.calls[0][0] as CustomEvent).detail.view).toBe('/admin-users');

        profileBtn.click();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        expect((dispatchSpy.mock.calls[1][0] as CustomEvent).detail.view).toBe('/profile');
    });

    it('deberia llamar a api.logout al presionar el boton de salir', async () => {
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '2',
            email: 'student@test.com',
            role: 'STUDENT',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });

        const logoutSpy = jest.spyOn(apiModule.api, 'logout').mockResolvedValue();

        renderNavbar('game');

        const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
        logoutBtn.click();

        expect(logoutSpy).toHaveBeenCalledTimes(1);
    });
});
