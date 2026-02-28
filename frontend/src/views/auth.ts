import { api } from '../api';
import { DOMManager } from '../dom-manager';
import { session } from '../session';

export class AuthView extends DOMManager {
    private loginTab: HTMLButtonElement;
    private formsContainer: HTMLElement;

    constructor() {
        super();
        this.loginTab = this.getElementSafe<HTMLButtonElement>('#login-tab');
        this.formsContainer = this.getElementSafe<HTMLElement>('#forms-container');

        this.initializeAuthInterface();
        this.showLoginForm();
    }

    initializeAuthInterface(): void {
        this.attachEvent(this.loginTab, 'click', () => this.showLoginForm());
    }

    showLoginForm(): void {
        this.renderLoginForm();
    }

    renderLoginForm(): void {
        this.clearContainer(this.formsContainer);

        const form = this.cloneTemplateElement<HTMLFormElement>('login-form-template');

        this.attachEvent(form, 'submit', (e) => this.processLogin(e));
        this.appendToContainer(this.formsContainer, form);
    }

    async processLogin(e: Event): Promise<void> {
        e.preventDefault();
        const errorDisplay = this.getElementSafe<HTMLElement>('#login-error');
        this.clearTextContent(errorDisplay);

        const email = this.getInputValue('login-email');
        const password = this.getInputValue('login-password');

        try {
            await this.authenticateUser(email, password);
            this.notifyAuthenticationSuccess();
        } catch (error) {
            this.displayLoginError(errorDisplay, error);
        }
    }

    async authenticateUser(email: string, password: string): Promise<void> {
        const user = await api.login(email, password);
        session.setUser(user);
    }

    notifyAuthenticationSuccess(): void {
        this.dispatchCustomEvent('navigate-to', { view: '/game' });
    }


    displayLoginError(errorElement: HTMLElement, error: unknown): void {
        const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
        this.setTextContent(errorElement, message);
    }

    destroy(): void {
        super.destroy();
    }
}
