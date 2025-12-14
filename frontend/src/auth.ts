// Authentication UI logic

import { api } from './api';

export class AuthManager {
    private loginTab: HTMLButtonElement;
    private registerTab: HTMLButtonElement;
    private formsContainer: HTMLElement;

    constructor() {
        this.loginTab = document.getElementById('login-tab') as HTMLButtonElement;
        this.registerTab = document.getElementById('register-tab') as HTMLButtonElement;
        this.formsContainer = document.getElementById('forms-container') as HTMLElement;

        this.setupEventListeners();
        // Initialize with login form
        this.switchTab('login');
    }

    private setupEventListeners(): void {
        // Tab switching
        this.loginTab.addEventListener('click', () => this.switchTab('login'));
        this.registerTab.addEventListener('click', () => this.switchTab('register'));
    }

    private switchTab(tab: 'login' | 'register'): void {
        // Update tab buttons
        if (tab === 'login') {
            this.loginTab.classList.add('active');
            this.registerTab.classList.remove('active');
        } else {
            this.registerTab.classList.add('active');
            this.loginTab.classList.remove('active');
        }

        // Remove all forms from DOM
        this.formsContainer.innerHTML = '';

        // Create and insert the active form
        if (tab === 'login') {
            this.createLoginForm();
        } else {
            this.createRegisterForm();
        }
    }

    private createLoginForm(): void {
        const form = document.createElement('form');
        form.id = 'login-form';
        form.className = 'auth-form active';
        form.innerHTML = `
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
        `;

        form.addEventListener('submit', (e) => this.handleLogin(e));
        this.formsContainer.appendChild(form);
    }

    private createRegisterForm(): void {
        const form = document.createElement('form');
        form.id = 'register-form';
        form.className = 'register-form active';
        form.innerHTML = `
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
        `;

        form.addEventListener('submit', (e) => this.handleRegister(e));
        this.formsContainer.appendChild(form);
    }

    private async handleLogin(e: Event): Promise<void> {
        e.preventDefault();
        const loginError = document.getElementById('login-error') as HTMLElement;
        loginError.textContent = '';

        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const password = (document.getElementById('login-password') as HTMLInputElement).value;

        try {
            await api.login(email, password);
            this.onAuthSuccess();
        } catch (error) {
            loginError.textContent = error instanceof Error ? error.message : 'Error al iniciar sesión';
        }
    }

    private async handleRegister(e: Event): Promise<void> {
        e.preventDefault();
        const registerError = document.getElementById('register-error') as HTMLElement;
        registerError.textContent = '';

        const email = (document.getElementById('register-email') as HTMLInputElement).value;
        const password = (document.getElementById('register-password') as HTMLInputElement).value;

        if (password.length < 6) {
            registerError.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }

        try {
            await api.register(email, password);
            this.onAuthSuccess();
        } catch (error) {
            registerError.textContent = error instanceof Error ? error.message : 'Error al registrarse';
        }
    }

    private onAuthSuccess(): void {
        // Dispatch custom event that main.ts will listen to
        window.dispatchEvent(new CustomEvent('auth-success'));
    }
}
