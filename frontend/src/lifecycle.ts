import { DOMManager } from "./dom-manager";

export interface View {
    destroy(): void;
}
/*
export class Lifecycle implements View {

    private domManager: DOMManager;

    constructor() {
        this.domManager = new DOMManager();
    }

    destroy(): void {
        this.activeEventListeners.forEach(({ element, eventType, handler }) => {
            element.removeEventListener(eventType, handler);
        });
        this.activeEventListeners = [];
    }
}
    */