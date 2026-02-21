import { api } from "../../api";
import { session } from "../../session";

export class AppNavbar extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const currentView = this.getAttribute("view") || "game";
        const title = currentView === "profile" ? "📊 Mi Perfil" :
            currentView === "admin" ? "👥 Admin de Usuarios" : "🎮 Tamagotchi HTML";
        const btnText = currentView !== "game" ? "Volver al Juego" : "Mi Perfil";
        const navigateTo = currentView !== "game" ? "/game" : "/profile";

        const user = session.getUser();
        const showAdminBtn = user?.role === 'PROFESSOR';
        const isAdminView = currentView === 'admin';

        this.innerHTML = `
            <nav class="navbar">
                <div class="nav-content">
                    <h2>${title}</h2>
                    
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
                        ${showAdminBtn ? `
                            <button id="admin-nav-btn" class="btn-secondary" ${isAdminView ? 'disabled' : ''}>
                                ${isAdminView ? 'Admin Activo' : 'Admin de Usuarios'}
                            </button>
                            <button id="profile-nav-btn" class="btn-secondary" ${currentView === 'profile' ? 'disabled' : ''}>
                                ${currentView === 'profile' ? 'Perfil Activo' : 'Mi Perfil'}
                            </button>
                            <button id="game-nav-btn" class="btn-secondary" ${currentView === 'game' ? 'disabled' : ''}>
                                ${currentView === 'game' ? 'Juego Activo' : 'Volver al Juego'}
                            </button>
                        ` : `
                            <button id="nav-action-btn" class="btn-secondary">${btnText}</button>
                        `}
                        <button id="logout-btn" class="btn-secondary">Salir</button>
                    </div>
                </div>
            </nav>
        `;

        this.querySelector("#admin-nav-btn")?.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", {
                detail: { view: "/admin-users" }
            }));
        });

        this.querySelector("#profile-nav-btn")?.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", {
                detail: { view: "/profile" }
            }));
        });

        this.querySelector("#game-nav-btn")?.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", {
                detail: { view: "/game" }
            }));
        });

        this.querySelector("#nav-action-btn")?.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent("navigate-to", {
                detail: { view: navigateTo }
            }));
        });

        this.querySelector("#logout-btn")?.addEventListener("click", async () => {

            await api.logout();
            window.dispatchEvent(new CustomEvent("navigate-to", { detail: { view: "/" } }));
        });
    }
}

customElements.define("app-navbar", AppNavbar);