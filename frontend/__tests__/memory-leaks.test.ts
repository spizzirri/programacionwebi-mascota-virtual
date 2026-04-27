import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { DOMManager } from '../src/dom-manager';
import { AppNavbar } from '../src/web-components/navbar';
import { session } from '../src/session';
import * as apiModule from '../src/api';

class TestView extends DOMManager {
    constructor() {
        super();
    }
}

describe('DOMManager - listener lifecycle', () => {
    let view: TestView;

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="test-btn">Click</button>
            <form id="test-form"><input type="text" /></form>
        `;
        view = new TestView();
    });

    afterEach(() => {
        view.destroy();
        document.body.innerHTML = '';
    });

    it('attachEvent deberia registrar el listener en activeEventListeners', () => {
        const btn = document.getElementById('test-btn')!;
        const handler = jest.fn();

        view['attachEvent'](btn, 'click', handler);
        const listeners = view['activeEventListeners'] as Array<any>;

        expect(listeners).toHaveLength(1);
        expect(listeners[0].element).toBe(btn);
        expect(listeners[0].eventType).toBe('click');
    });

    it('destroy deberia remover todos los listeners registrados', () => {
        const btn = document.getElementById('test-btn')!;
        const form = document.getElementById('test-form')! as HTMLFormElement;

        const clickHandler = jest.fn();
        const submitHandler = jest.fn();

        view['attachEvent'](btn, 'click', clickHandler);
        view['attachEvent'](form, 'submit', submitHandler);

        btn.click();
        expect(clickHandler).toHaveBeenCalledTimes(1);

        view.destroy();

        clickHandler.mockClear();
        submitHandler.mockClear();

        btn.click();
        expect(clickHandler).not.toHaveBeenCalled();

        form.dispatchEvent(new Event('submit'));
        expect(submitHandler).not.toHaveBeenCalled();
    });

    it('destroy deberia limpiar el array activeEventListeners', () => {
        const btn = document.getElementById('test-btn')!;
        view['attachEvent'](btn, 'click', jest.fn());

        view.destroy();
        const listeners = view['activeEventListeners'] as Array<any>;
        expect(listeners).toHaveLength(0);
    });
});

describe('DOMManager - showAlert sin fugas', () => {
    let view: TestView;

    beforeEach(() => {
        document.body.innerHTML = '';
        view = new TestView();
    });

    afterEach(() => {
        view.destroy();
        document.body.innerHTML = '';
    });

    it('showAlert NO deberia agregar listeners a activeEventListeners', async () => {
        const promise = view['showAlert']('Test message');

        const listeners = view['activeEventListeners'] as Array<any>;
        expect(listeners).toHaveLength(0);

        const acceptBtn = document.querySelector('.btn-primary') as HTMLButtonElement;
        acceptBtn.click();
        await promise;
    });

    it('showAlert deberia remover el modal del DOM al hacer clic en Aceptar', async () => {
        const promise = view['showAlert']('Test message');

        let modal = document.querySelector('.alert-modal-container');
        expect(modal).not.toBeNull();

        const acceptBtn = document.querySelector('.btn-primary') as HTMLButtonElement;
        acceptBtn.click();
        await promise;

        modal = document.querySelector('.alert-modal-container');
        expect(modal).toBeNull();
    });

    it('destroy deberia remover el modal huerfano si showAlert sigue abierto', () => {
        view['showAlert']('Orphaned modal');

        let modal = document.querySelector('.alert-modal-container');
        expect(modal).not.toBeNull();

        view.destroy();

        modal = document.querySelector('.alert-modal-container');
        expect(modal).toBeNull();
    });
});

describe('AppNavbar - disconnectedCallback limpia listeners', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
        jest.spyOn(session, 'getUser').mockReturnValue({
            _id: '1',
            email: 'admin@test.com',
            role: 'PROFESSOR',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: ''
        });
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('deberia tener listeners registrados despues de connectedCallback', () => {
        const navbar = new AppNavbar();
        navbar.setAttribute('view', 'game');
        document.body.appendChild(navbar);

        const listeners = navbar['listeners'] as Array<any>;
        expect(listeners.length).toBeGreaterThan(0);
    });

    it('disconnectedCallback deberia remover todos los listeners', () => {
        const navbar = new AppNavbar();
        navbar.setAttribute('view', 'game');
        document.body.appendChild(navbar);

        const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
        const adminBtn = document.getElementById('admin-nav-btn') as HTMLButtonElement;
        adminBtn.click();
        expect(dispatchSpy).toHaveBeenCalledTimes(1);

        dispatchSpy.mockClear();
        navbar.remove();

        adminBtn.click();
        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('disconnectedCallback no deberia lanzar error si se llama dos veces', () => {
        const navbar = new AppNavbar();
        navbar.setAttribute('view', 'game');
        document.body.appendChild(navbar);

        navbar.remove();
        expect(() => navbar['disconnectedCallback']()).not.toThrow();
    });
});

describe('AdminUsersView - destroy limpia listeners', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <table id="users-table-body"></table>
            <div id="user-modal" class="hidden"></div>
            <div id="delete-modal" class="hidden"></div>
            <form id="user-form">
                <input id="user-id" />
                <input id="user-email" />
                <input id="user-password" />
                <select id="user-role"></select>
                <select id="user-commission"></select>
            </form>
            <div id="modal-title"></div>
            <div id="delete-user-email"></div>
            <input id="user-filter-text" />
            <button id="add-user-btn"></button>
            <button id="close-modal"></button>
            <button id="close-delete-modal"></button>
            <button id="confirm-delete"></button>
            <button id="tab-all"></button>
            <button id="tab-manana"></button>
            <button id="tab-noche"></button>
            <button id="sort-email"></button>
            <button id="sort-streak"></button>
        `;
        jest.spyOn(apiModule.api, 'getAllUsers' as any).mockResolvedValue([]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('should remove all listeners on destroy', async () => {
        const { AdminUsersView } = await import('../src/views/admin-users');
        const view = new AdminUsersView();

        const listeners = (view as any)['activeEventListeners'] as Array<any>;
        expect(listeners.length).toBeGreaterThanOrEqual(10);

        view.destroy();

        expect((view as any)['activeEventListeners']).toHaveLength(0);
    });
});

describe('AdminQuestionsView - destroy limpia listeners', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <table id="questions-table-body"></table>
            <div id="question-modal" class="hidden"></div>
            <div id="delete-modal" class="hidden"></div>
            <div id="delete-all-modal" class="hidden"></div>
            <div id="topic-modal" class="hidden"></div>
            <form id="question-form">
                <input id="question-id" />
                <input id="question-text" />
                <input id="question-topic" />
            </form>
            <form id="topic-form">
                <input id="topic-name-hidden" />
                <input id="topic-enabled" type="checkbox" />
                <input id="topic-start-date" />
                <input id="topic-end-date" />
            </form>
            <div id="modal-title"></div>
            <div id="delete-question-text"></div>
            <input id="file-input" type="file" />
            <select id="filter-topic"></select>
            <input id="filter-text" />
            <div id="topics-list"></div>
            <button id="add-question-btn"></button>
            <button id="close-modal"></button>
            <button id="close-delete-modal"></button>
            <button id="confirm-delete"></button>
            <button id="delete-all-btn"></button>
            <button id="close-delete-all-modal"></button>
            <button id="confirm-delete-all"></button>
            <button id="import-questions-btn"></button>
            <button id="close-topic-modal"></button>
        `;
        jest.spyOn(apiModule.api, 'getAllQuestions' as any).mockResolvedValue([]);
        jest.spyOn(apiModule.api, 'getAllTopics' as any).mockResolvedValue([]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('should remove all listeners on destroy', async () => {
        const { AdminQuestionsView } = await import('../src/views/admin-questions');
        const view = new AdminQuestionsView();

        const listeners = (view as any)['activeEventListeners'] as Array<any>;
        expect(listeners.length).toBeGreaterThanOrEqual(15);

        view.destroy();

        expect((view as any)['activeEventListeners']).toHaveLength(0);
    });
});

describe('ProfileView - destroy limpia listeners', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="profile-email"></div>
            <div id="profile-streak"></div>
            <div id="history-container"></div>
            <form id="password-form">
                <input id="current-password" />
                <input id="new-password" />
                <input id="confirm-password" />
            </form>
            <div id="password-change-section"></div>
        `;
        jest.spyOn(apiModule.api, 'getProfile' as any).mockResolvedValue({
            email: 'test@test.com',
            streak: 0
        });
        jest.spyOn(apiModule.api, 'getHistory' as any).mockResolvedValue([]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('should remove the form submit listener on destroy', async () => {
        const { ProfileView } = await import('../src/views/profile');
        const view = new ProfileView();

        const listeners = (view as any)['activeEventListeners'] as Array<any>;
        expect(listeners.length).toBeGreaterThanOrEqual(1);

        view.destroy();

        expect((view as any)['activeEventListeners']).toHaveLength(0);
    });
});
