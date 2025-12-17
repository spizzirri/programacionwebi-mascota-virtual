import { api } from "../../api";

export class AppNavbar extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const currentView = this.getAttribute("view") || "game";
        const title = currentView === "profile" ? "📊 Mi Perfil" : "🎮 Tamagotchi HTML";
        const btnText = currentView === "profile" ? "Volver al Juego" : "Mi Perfil";
        const navigateTo = currentView === "profile" ? "/game" : "/profile";

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
                        <button id="nav-action-btn" class="btn-secondary">${btnText}</button>
                        <button id="logout-btn" class="btn-secondary">Salir</button>
                    </div>
                </div>
            </nav>
        `;

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