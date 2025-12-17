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
    protected attachEvent<K extends keyof HTMLElementEventMap>(
        element: HTMLElement,
        eventType: K,
        handler: (event: HTMLElementEventMap[K]) => void
    ): void {
        element.addEventListener(eventType, handler);
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
}
