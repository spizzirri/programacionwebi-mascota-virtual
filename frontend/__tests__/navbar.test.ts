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

    it('deberia mostrar botones de navegación para el rol PROFESSOR', () => {
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

        const adminAppealsBtn = document.getElementById('admin-appeals-nav-btn') as HTMLButtonElement;
        const adminBtn = document.getElementById('admin-nav-btn') as HTMLButtonElement;
        const profileBtn = document.getElementById('profile-nav-btn') as HTMLButtonElement;
        const gameBtn = document.getElementById('game-nav-btn') as HTMLButtonElement;

        expect(adminAppealsBtn).not.toBeNull();
        expect(adminBtn).not.toBeNull();
        expect(profileBtn).not.toBeNull();
        expect(gameBtn).not.toBeNull();

        expect(adminBtn.disabled).toBe(false);
        expect(profileBtn.disabled).toBe(true); // Está en la vista profile
        expect(gameBtn.disabled).toBe(false);
    });

    it('deberia mostrar botones de navegación para el rol STUDENT', () => {
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

        const myAppealsBtn = document.getElementById('my-appeals-nav-btn') as HTMLButtonElement;
        const profileBtn = document.getElementById('profile-nav-btn') as HTMLButtonElement;
        const gameBtn = document.getElementById('game-nav-btn') as HTMLButtonElement;

        expect(myAppealsBtn).not.toBeNull();
        expect(profileBtn).not.toBeNull();
        expect(gameBtn).not.toBeNull();

        expect(gameBtn.disabled).toBe(true); // Está en la vista game
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
        const adminAppealsBtn = document.getElementById('admin-appeals-nav-btn') as HTMLButtonElement;

        adminBtn.click();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        expect((dispatchSpy.mock.calls[0][0] as CustomEvent).detail.view).toBe('/admin-users');

        profileBtn.click();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        expect((dispatchSpy.mock.calls[1][0] as CustomEvent).detail.view).toBe('/profile');

        adminAppealsBtn.click();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        expect((dispatchSpy.mock.calls[2][0] as CustomEvent).detail.view).toBe('/admin-appeals');
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
