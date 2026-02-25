// Base class for DOM manipulation utilities
// Provides low-level DOM operations: element creation, event handling, class management

export class DOMManager {
    /**
     * Creates an HTML element with specified attributes and content
     */
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

    /**
     * Adds a CSS class to an element
     */
    protected addClass(element: HTMLElement, className: string): void {
        element.classList.add(className);
    }

    /**
     * Removes a CSS class from an element
     */
    protected removeClass(element: HTMLElement, className: string): void {
        element.classList.remove(className);
    }

    /**
     * Toggles CSS classes between two elements (useful for tabs)
     */
    protected toggleClasses(
        activeElement: HTMLElement,
        inactiveElement: HTMLElement,
        activeClass: string
    ): void {
        this.addClass(activeElement, activeClass);
        this.removeClass(inactiveElement, activeClass);
    }

    /**
     * Attaches an event listener to an element
     */
    private activeEventListeners: Array<{
        element: HTMLElement;
        eventType: string;
        handler: EventListenerOrEventListenerObject;
    }> = [];

    /**
     * Attaches an event listener to an element and tracks it for cleanup
     */
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

    /**
     * Removes all tracked event listeners and cleans up resources
     * Should be called when the view is being dismantled
     */
    public destroy(): void {
        this.activeEventListeners.forEach(({ element, eventType, handler }) => {
            element.removeEventListener(eventType, handler);
        });
        this.activeEventListeners = [];
    }

    /**
     * Clears all children from a container element
     */
    protected clearContainer(container: HTMLElement): void {
        container.innerHTML = '';
    }

    /**
     * Appends a child element to a parent container
     */
    protected appendToContainer(parent: HTMLElement, child: HTMLElement): void {
        parent.appendChild(child);
    }

    /**
     * Gets an element by selector with type safety
     */
    protected getElementSafe<T extends Element>(selector: string): T {
        const element = document.querySelector(selector) as T;
        if (!element) {
            throw new Error(`Element with selector "${selector}" not found`);
        }
        return element;
    }

    /**
     * Gets the value from an input element
     */
    protected getInputValue(id: string): string {
        const input = this.getElementSafe<HTMLInputElement>(`#${id}`);
        return input.value;
    }

    /**
     * Sets text content for an element
     */
    protected setTextContent(element: HTMLElement, text: string): void {
        element.textContent = text;
    }

    /**
     * Clears text content for an element
     */
    protected clearTextContent(element: HTMLElement): void {
        element.textContent = '';
    }

    /**
     * Dispatches a custom event from window
     */
    protected dispatchCustomEvent(eventName: string, detail?: any): void {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Clones an HTML template element
     * @param templateId - ID of the template element to clone
     * @returns The cloned content as a DocumentFragment
     */
    protected cloneTemplate(templateId: string): DocumentFragment {
        const template = this.getElementSafe<HTMLTemplateElement>(`#${templateId}`);
        return template.content.cloneNode(true) as DocumentFragment;
    }

    /**
     * Clones a template and returns the first element child
     * @param templateId - ID of the template element to clone
     * @returns The first element from the cloned template
     */
    protected cloneTemplateElement<T extends HTMLElement>(templateId: string): T {
        const fragment = this.cloneTemplate(templateId);
        const element = fragment.firstElementChild as T;

        if (!element) {
            throw new Error(`Template "${templateId}" has no element children`);
        }

        return element;
    }
    /**
     * Shows a custom alert modal
     */
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
