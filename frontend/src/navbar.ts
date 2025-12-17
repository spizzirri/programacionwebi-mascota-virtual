import { api } from "./api";
import { DOMManager } from "./dom-manager";

export class Navbar extends DOMManager {

    private profileBtn: HTMLElement | null = null;
    private logoutBtn: HTMLElement | null = null;

    constructor() {
        super();

        this.profileBtn = this.getElementByIdSafe("toggle-profile-game-btn");
        this.logoutBtn = this.getElementByIdSafe("logout-btn");

        this.initEventListeners();
    }

    private initEventListeners(): void {
        if (window.location.pathname == "/game")
            this.profileBtn?.addEventListener("click", () => this.dispatchCustomEvent("navigate-to", { view: "/profile" }));
        else
            this.profileBtn?.addEventListener("click", () => this.dispatchCustomEvent("navigate-to", { view: "/game" }));

        this.logoutBtn?.addEventListener("click", async () => {
            await api.logout();
            this.dispatchCustomEvent("navigate-to", { view: "/" });
        });
    }
}