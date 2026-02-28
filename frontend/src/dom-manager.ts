export class DOMManager {

    protected createElement<K extends keyof HTMLElementTagNameMap>(
        tag: K,
        attributes?: Record<string, string>,
        innerHTML?: string
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tag);

        if (attributes) {
            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        if (innerHTML) {
            element.innerHTML = innerHTML;
        }

        return element;
    }

    protected addClass(element: HTMLElement, className: string): void {
        element.classList.add(className);
    }

    protected removeClass(element: HTMLElement, className: string): void {
        element.classList.remove(className);
    }

    protected toggleClasses(
        activeElement: HTMLElement,
        inactiveElement: HTMLElement,
        activeClass: string
    ): void {
        this.addClass(activeElement, activeClass);
        this.removeClass(inactiveElement, activeClass);
    }

    private activeEventListeners: Array<{
        element: HTMLElement;
        eventType: string;
        handler: EventListenerOrEventListenerObject;
    }> = [];

    protected attachEvent<K extends keyof HTMLElementEventMap>(
        element: HTMLElement,
        eventType: K,
        handler: (event: HTMLElementEventMap[K]) => void
    ): void {
        element.addEventListener(eventType, handler as EventListener);
        this.activeEventListeners.push({
            element,
            eventType,
            handler: handler as EventListener
        });
    }

    public destroy(): void {
        this.activeEventListeners.forEach(({ element, eventType, handler }) => {
            element.removeEventListener(eventType, handler);
        });
        this.activeEventListeners = [];
    }

    protected clearContainer(container: HTMLElement): void {
        container.innerHTML = '';
    }

    protected appendToContainer(parent: HTMLElement, child: HTMLElement): void {
        parent.appendChild(child);
    }

    protected getElementSafe<T extends Element>(selector: string): T {
        const element = document.querySelector(selector) as T;
        if (!element) {
            throw new Error(`Element with selector "${selector}" not found`);
        }
        return element;
    }

    protected getInputValue(id: string): string {
        const input = this.getElementSafe<HTMLInputElement>(`#${id}`);
        return input.value;
    }

    protected setTextContent(element: HTMLElement, text: string): void {
        element.textContent = text;
    }

    protected clearTextContent(element: HTMLElement): void {
        element.textContent = '';
    }

    protected dispatchCustomEvent(eventName: string, detail?: any): void {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    protected cloneTemplate(templateId: string): DocumentFragment {
        const template = this.getElementSafe<HTMLTemplateElement>(`#${templateId}`);
        return template.content.cloneNode(true) as DocumentFragment;
    }

    protected cloneTemplateElement<T extends HTMLElement>(templateId: string): T {
        const fragment = this.cloneTemplate(templateId);
        const element = fragment.firstElementChild as T;

        if (!element) {
            throw new Error(`Template "${templateId}" has no element children`);
        }

        return element;
    }

    protected showAlert(message: string): Promise<void> {
        return new Promise((resolve) => {
            const container = this.createElement('div', { class: 'alert-modal-container' });
            const content = this.createElement('div', { class: 'alert-modal-content' });
            const p = this.createElement('p', {}, message);
            const btn = this.createElement('button', { class: 'btn-primary' }, 'Aceptar');

            this.appendToContainer(content, p);
            this.appendToContainer(content, btn);
            this.appendToContainer(container, content);
            this.appendToContainer(document.body, container);

            this.attachEvent(btn, 'click', () => {
                document.body.removeChild(container);
                resolve();
            });

            this.attachEvent(container, 'click', (e) => {
                if (e.target === container) {
                    document.body.removeChild(container);
                    resolve();
                }
            });
        });
    }
}
