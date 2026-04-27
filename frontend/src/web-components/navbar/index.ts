import { api } from "../../api";
import { session } from "../../session";

type ListenerEntry = { element: HTMLElement; type: string; handler: EventListenerOrEventListenerObject };

export class AppNavbar extends HTMLElement {
    private listeners: ListenerEntry[] = [];

    private addListener<K extends keyof HTMLElementEventMap>(
        selector: string,
        type: K,
        handler: (event: HTMLElementEventMap[K]) => void
    ): void {
        const el = this.querySelector(selector);
        if (el) {
            el.addEventListener(type, handler as EventListener);
            this.listeners.push({ element: el as HTMLElement, type, handler: handler as EventListener });
        }
    }

    constructor() {
        super();
    }

    connectedCallback() {
        const currentView = this.getAttribute("view") || "game";
        const title = currentView === "profile" ? "📊 Mi Perfil" :
            currentView === "admin-users" ? "👥 Admin de Usuarios" :
                currentView === "admin-questions" ? "📚 Admin de Preguntas" :
                    currentView === "admin-appeals" ? "⚖️ Apelaciones" :
                        currentView === "my-appeals" ? "📜 Mis Apelaciones" : "🎮 Mascota Virtual";

        const user = session.getUser();
        const isProfessor = user?.role === 'PROFESSOR';

        this.innerHTML = `
            <nav class="navbar">
                <div class="nav-content">
                    <div class="nav-header">
                        <h2>${title}</h2>
                        <button id="mobile-menu-btn" class="mobile-menu-btn">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                    
                    ${currentView === 'game' ? `
                        <div id="streak-display" class="streak-display">
                            <div class="book-icon">
                                <svg viewBox="0 0 100 120" class="book-svg">
                                    <path d="M20 10 L80 10 L80 110 L50 100 L20 110 Z" fill="currentColor" />
                                    <text x="50" y="65" class="streak-number" text-anchor="middle">0</text>
                                </svg>
                            </div>
                            <p class="streak-label">Racha</p>
                        </div>
                    ` : ''}

                    <div class="nav-actions">
                        ${isProfessor ? `
                            <button id="admin-appeals-nav-btn" class="btn-secondary" ${currentView === 'admin-appeals' ? 'disabled' : ''}>
                                ${currentView === 'admin-appeals' ? 'Apelaciones Activo' : 'Apelaciones'}
                            </button>
                            <button id="admin-questions-nav-btn" class="btn-secondary" ${currentView === 'admin-questions' ? 'disabled' : ''}>
                                ${currentView === 'admin-questions' ? 'Preguntas Activo' : 'Admin de Preguntas'}
                            </button>
                            <button id="admin-nav-btn" class="btn-secondary" ${currentView === 'admin-users' ? 'disabled' : ''}>
                                ${currentView === 'admin-users' ? 'Admin Activo' : 'Admin de Usuarios'}
                            </button>
                            <button id="profile-nav-btn" class="btn-secondary" ${currentView === 'profile' ? 'disabled' : ''}>
                                Mi Perfil
                            </button>
                            <button id="game-nav-btn" class="btn-secondary" ${currentView === 'game' ? 'disabled' : ''}>
                                Volver al Juego
                            </button>
                        ` : `
                            <button id="my-appeals-nav-btn" class="btn-secondary" ${currentView === 'my-appeals' ? 'disabled' : ''}>
                                Mis Apelaciones
                            </button>
                            <button id="profile-nav-btn" class="btn-secondary" ${currentView === 'profile' ? 'disabled' : ''}>
                                Mi Perfil
                            </button>
                            <button id="game-nav-btn" class="btn-secondary" ${currentView === 'game' ? 'disabled' : ''}>
                                Volver al Juego
                            </button>
                        `}
                        <button id="logout-btn" class="btn-secondary">Salir</button>
                    </div>
                </div>
            </nav>
        `;

        this.addListener("#admin-appeals-nav-btn", "click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/admin-appeals" } }));
        });

        this.addListener("#admin-questions-nav-btn", "click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/admin-questions" } }));
        });

        this.addListener("#admin-nav-btn", "click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/admin-users" } }));
        });

        this.addListener("#my-appeals-nav-btn", "click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/my-appeals" } }));
        });

        this.addListener("#profile-nav-btn", "click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/profile" } }));
        });

        this.addListener("#game-nav-btn", "click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/game" } }));
        });

        this.addListener("#logout-btn", "click", async () => {
            await api.logout();
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/" } }));
        });

        this.addListener("#mobile-menu-btn", "click", () => {
            const nav = this.querySelector(".navbar");
            nav?.classList.toggle("menu-open");
        });
    }

    disconnectedCallback(): void {
        this.listeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.listeners = [];
    }
}

customElements.define("app-navbar", AppNavbar);