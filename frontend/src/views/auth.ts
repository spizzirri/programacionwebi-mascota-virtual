// Authentication business logic
// Manages user authentication flow: login, registration, and form switching

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

    /**
     * Sets up the authentication interface with event listeners
     */
    initializeAuthInterface(): void {
        this.attachEvent(this.loginTab, 'click', () => this.showLoginForm());
    }

    /**
     * Displays the login form and activates the login tab
     */
    showLoginForm(): void {
        this.renderLoginForm();
    }

    /**
     * Renders the login form in the forms container
     */
    renderLoginForm(): void {
        this.clearContainer(this.formsContainer);

        const form = this.cloneTemplateElement<HTMLFormElement>('login-form-template');

        this.attachEvent(form, 'submit', (e) => this.processLogin(e));
        this.appendToContainer(this.formsContainer, form);
    }

    /**
     * Processes user login attempt
     */
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

    /**
     * Authenticates a user with the API
     */
    async authenticateUser(email: string, password: string): Promise<void> {
        const user = await api.login(email, password);
        session.setUser(user);
    }

    /**
     * Notifies the application of successful authentication
     */
    notifyAuthenticationSuccess(): void {
        this.dispatchCustomEvent('navigate-to', { view: '/game' });
    }

    /**
     * Displays login error message
     */
    displayLoginError(errorElement: HTMLElement, error: unknown): void {
        const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
        this.setTextContent(errorElement, message);
    }

    /**
     * Clean up resources when the view is destroyed
     */
    destroy(): void {
        super.destroy();
    }
}
