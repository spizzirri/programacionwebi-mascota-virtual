// Authentication UI logic

import { api } from './api';

export class AuthManager {
    private loginForm: HTMLFormElement;
    private registerForm: HTMLFormElement;
    private loginTab: HTMLButtonElement;
    private registerTab: HTMLButtonElement;
    private loginError: HTMLElement;
    private registerError: HTMLElement;

    constructor() {
        this.loginForm = document.getElementById('login-form') as HTMLFormElement;
        this.registerForm = document.getElementById('register-form') as HTMLFormElement;
        this.loginTab = document.getElementById('login-tab') as HTMLButtonElement;
        this.registerTab = document.getElementById('register-tab') as HTMLButtonElement;
        this.loginError = document.getElementById('login-error') as HTMLElement;
        this.registerError = document.getElementById('register-error') as HTMLElement;

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Tab switching
        this.loginTab.addEventListener('click', () => this.switchTab('login'));
        this.registerTab.addEventListener('click', () => this.switchTab('register'));

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    private switchTab(tab: 'login' | 'register'): void {
        if (tab === 'login') {
            this.loginTab.classList.add('active');
            this.registerTab.classList.remove('active');
            this.loginForm.classList.add('active');
            this.registerForm.classList.remove('active');
            this.loginError.textContent = '';
            this.registerError.textContent = '';
        } else {
            this.registerTab.classList.add('active');
            this.loginTab.classList.remove('active');
            this.registerForm.classList.add('active');
            this.loginForm.classList.remove('active');
            this.loginError.textContent = '';
            this.registerError.textContent = '';
        }
    }

    private async handleLogin(e: Event): Promise<void> {
        e.preventDefault();
        this.loginError.textContent = '';

        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const password = (document.getElementById('login-password') as HTMLInputElement).value;

        try {
            await api.login(email, password);
            this.onAuthSuccess();
        } catch (error) {
            this.loginError.textContent = error instanceof Error ? error.message : 'Error al iniciar sesión';
        }
    }

    private async handleRegister(e: Event): Promise<void> {
        e.preventDefault();
        this.registerError.textContent = '';

        const email = (document.getElementById('register-email') as HTMLInputElement).value;
        const password = (document.getElementById('register-password') as HTMLInputElement).value;

        if (password.length < 6) {
            this.registerError.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }

        try {
            await api.register(email, password);
            this.onAuthSuccess();
        } catch (error) {
            this.registerError.textContent = error instanceof Error ? error.message : 'Error al registrarse';
        }
    }

    private onAuthSuccess(): void {
        // Dispatch custom event that main.ts will listen to
        window.dispatchEvent(new CustomEvent('auth-success'));
    }
}
