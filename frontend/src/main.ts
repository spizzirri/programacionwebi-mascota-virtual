// Main application entry point

import { AuthManager } from './auth';
import { GameManager } from './game';
import { ProfileManager } from './profile';
import { api } from './api';

class App {
    private authPage: HTMLElement;
    private gamePage: HTMLElement;
    private profilePage: HTMLElement;
    private authManager: AuthManager | null = null;
    private gameManager: GameManager | null = null;
    private profileManager: ProfileManager | null = null;

    constructor() {
        this.authPage = document.getElementById('auth-page') as HTMLElement;
        this.gamePage = document.getElementById('game-page') as HTMLElement;
        this.profilePage = document.getElementById('profile-page') as HTMLElement;

        this.init();
    }

    private async init(): Promise<void> {
        // Check if user is already logged in
        try {
            await api.getCurrentUser();
            this.showGamePage();
        } catch {
            this.showAuthPage();
        }

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Auth success event
        window.addEventListener('auth-success', () => {
            this.showGamePage();
        });

        // Logout buttons
        const logoutBtn = document.getElementById('logout-btn');
        const logoutProfileBtn = document.getElementById('logout-profile-btn');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        if (logoutProfileBtn) {
            logoutProfileBtn.addEventListener('click', () => this.handleLogout());
        }

        // Profile navigation
        const profileBtn = document.getElementById('profile-btn');
        const backToGameBtn = document.getElementById('back-to-game-btn');

        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfilePage());
        }

        if (backToGameBtn) {
            backToGameBtn.addEventListener('click', () => this.showGamePage());
        }
    }

    private showAuthPage(): void {
        this.authPage.classList.add('active');
        this.gamePage.classList.remove('active');
        this.profilePage.classList.remove('active');

        if (!this.authManager) {
            this.authManager = new AuthManager();
        }
    }

    private showGamePage(): void {
        this.authPage.classList.remove('active');
        this.gamePage.classList.add('active');
        this.profilePage.classList.remove('active');

        if (!this.gameManager) {
            this.gameManager = new GameManager();
        }
    }

    private showProfilePage(): void {
        this.authPage.classList.remove('active');
        this.gamePage.classList.remove('active');
        this.profilePage.classList.add('active');

        if (!this.profileManager) {
            this.profileManager = new ProfileManager();
        } else {
            this.profileManager.refresh();
        }
    }

    private async handleLogout(): Promise<void> {
        try {
            await api.logout();
            this.gameManager = null;
            this.profileManager = null;
            this.showAuthPage();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}
