// Authentication business logic
// Manages user authentication flow: login, registration, and form switching

import { api } from '../api';
import { DOMManager } from '../dom-manager';
import { session } from '../session';

export class AuthView extends DOMManager {
    private loginTab: HTMLButtonElement;
    private registerTab: HTMLButtonElement;
    private formsContainer: HTMLElement;

    constructor() {
        super();
        this.loginTab = this.getElementSafe<HTMLButtonElement>('#login-tab');
        this.registerTab = this.getElementSafe<HTMLButtonElement>('#register-tab');
        this.formsContainer = this.getElementSafe<HTMLElement>('#forms-container');

        this.initializeAuthInterface();
        this.showLoginForm();
    }

    /**
     * Sets up the authentication interface with event listeners
     */
    initializeAuthInterface(): void {
        this.attachEvent(this.loginTab, 'click', () => this.showLoginForm());
        this.attachEvent(this.registerTab, 'click', () => this.showRegistrationForm());
    }

    /**
     * Displays the login form and activates the login tab
     */
    showLoginForm(): void {
        this.activateTab('login');
        this.renderLoginForm();
    }

    /**
     * Displays the registration form and activates the register tab
     */
    showRegistrationForm(): void {
        this.activateTab('register');
        this.renderRegistrationForm();
    }

    /**
     * Activates the specified tab (login or register)
     */
    activateTab(tab: 'login' | 'register'): void {
        if (tab === 'login') {
            this.toggleClasses(this.loginTab, this.registerTab, 'active');
        } else {
            this.toggleClasses(this.registerTab, this.loginTab, 'active');
        }
    }

    /**
     * Renders the login form in the forms container
     */
    renderLoginForm(): void {
        this.clearContainer(this.formsContainer);

        // Clone the login form template from HTML
        const form = this.cloneTemplateElement<HTMLFormElement>('login-form-template');

        this.attachEvent(form, 'submit', (e) => this.processLogin(e));
        this.appendToContainer(this.formsContainer, form);
    }

    /**
     * Renders the registration form in the forms container
     */
    renderRegistrationForm(): void {
        this.clearContainer(this.formsContainer);

        // Clone the register form template from HTML
        const form = this.cloneTemplateElement<HTMLFormElement>('register-form-template');

        this.attachEvent(form, 'submit', (e) => this.processRegistration(e));
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
     * Processes user registration attempt
     */
    async processRegistration(e: Event): Promise<void> {
        e.preventDefault();
        const errorDisplay = this.getElementSafe<HTMLElement>('#register-error');
        this.clearTextContent(errorDisplay);

        const email = this.getInputValue('register-email');
        const password = this.getInputValue('register-password');
        const role = (this.getElementSafe<HTMLInputElement>('input[name="role"]:checked')).value;

        if (!this.validatePassword(password)) {
            this.setTextContent(errorDisplay, 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            await this.registerNewUser(email, password, role);
            this.notifyAuthenticationSuccess();
        } catch (error) {
            this.displayRegistrationError(errorDisplay, error);
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
     * Registers a new user with the API
     */
    async registerNewUser(email: string, password: string, role: string): Promise<void> {
        const user = await api.register(email, password, role);
        session.setUser(user);
    }

    /**
     * Validates password meets minimum requirements
     */
    validatePassword(password: string): boolean {
        return password.length >= 6;
    }

    /**
     * Displays login error message
     */
    displayLoginError(errorElement: HTMLElement, error: unknown): void {
        const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
        this.setTextContent(errorElement, message);
    }

    /**
     * Displays registration error message
     */
    displayRegistrationError(errorElement: HTMLElement, error: unknown): void {
        const message = error instanceof Error ? error.message : 'Error al registrarse';
        this.setTextContent(errorElement, message);
    }

    /**
     * Notifies the application of successful authentication
     */
    notifyAuthenticationSuccess(): void {
        this.dispatchCustomEvent('navigate-to', { view: '/game' });
    }

    /**
     * Clean up resources when the view is destroyed
     */
    destroy(): void {
        super.destroy();
    }
}
