import { api, User } from './api';

class Session {
    private static instance: Session;
    private currentUser: User | null = null;
    private initialized: boolean = false;

    private constructor() { }

    public static getInstance(): Session {
        if (!Session.instance) {
            Session.instance = new Session();
        }
        return Session.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            this.currentUser = await api.getCurrentUser();
        } catch (error) {
            console.log('No active session found', error);
            this.currentUser = null;
        } finally {
            this.initialized = true;
        }
    }

    public isAuthenticated(): boolean {
        return !!this.currentUser;
    }

    public getUser(): User | null {
        return this.currentUser;
    }

    public setUser(user: User): void {
        this.currentUser = user;
    }

    public clearSession(): void {
        this.currentUser = null;
    }
}

export const session = Session.getInstance();
