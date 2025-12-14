// Authentication business logic
// Manages user authentication flow: login, registration, and form switching

import { api } from './api';
import { DOMManager } from './dom-manager';

export class AuthManager extends DOMManager {
    private loginTab: HTMLButtonElement;
    private registerTab: HTMLButtonElement;
    private formsContainer: HTMLElement;

    constructor() {
        super();
        this.loginTab = this.getElementByIdSafe<HTMLButtonElement>('login-tab');
        this.registerTab = this.getElementByIdSafe<HTMLButtonElement>('register-tab');
        this.formsContainer = this.getElementByIdSafe<HTMLElement>('forms-container');

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

        const form = this.createElement('form', {
            id: 'login-form',
            class: 'auth-form active'
        }, `
            <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" required placeholder="tu@email.com">
            </div>
            <div class="form-group">
                <label for="login-password">Contraseña</label>
                <input type="password" id="login-password" required placeholder="••••••••">
            </div>
            <button type="submit" id="login-button" class="btn-primary">Entrar</button>
            <div id="login-error" class="error-message"></div>
        `);

        this.attachEvent(form, 'submit', (e) => this.processLogin(e));
        this.appendToContainer(this.formsContainer, form);
    }

    /**
     * Renders the registration form in the forms container
     */
    renderRegistrationForm(): void {
        this.clearContainer(this.formsContainer);

        const form = this.createElement('form', {
            id: 'register-form',
            class: 'register-form active'
        }, `
            <div class="form-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" required placeholder="tu@email.com">
            </div>
            <div class="form-group">
                <label for="register-password">Contraseña</label>
                <input type="password" id="register-password" required placeholder="••••••••">
            </div>
            <button type="submit" id="register-button" class="btn-primary">Crear Cuenta</button>
            <div id="register-error" class="error-message"></div>
        `);

        this.attachEvent(form, 'submit', (e) => this.processRegistration(e));
        this.appendToContainer(this.formsContainer, form);
    }

    /**
     * Processes user login attempt
     */
    async processLogin(e: Event): Promise<void> {
        e.preventDefault();
        const errorDisplay = this.getElementByIdSafe<HTMLElement>('login-error');
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
        const errorDisplay = this.getElementByIdSafe<HTMLElement>('register-error');
        this.clearTextContent(errorDisplay);

        const email = this.getInputValue('register-email');
        const password = this.getInputValue('register-password');

        if (!this.validatePassword(password)) {
            this.setTextContent(errorDisplay, 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            await this.registerNewUser(email, password);
            this.notifyAuthenticationSuccess();
        } catch (error) {
            this.displayRegistrationError(errorDisplay, error);
        }
    }

    /**
     * Authenticates a user with the API
     */
    async authenticateUser(email: string, password: string): Promise<void> {
        await api.login(email, password);
    }

    /**
     * Registers a new user with the API
     */
    async registerNewUser(email: string, password: string): Promise<void> {
        await api.register(email, password);
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
        this.dispatchCustomEvent('auth-success');
    }
}
