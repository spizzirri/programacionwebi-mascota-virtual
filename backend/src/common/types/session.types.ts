export interface SessionData {
    userId?: string;
    _csrfSecret?: string;
    regenerate?: (callback: (err?: Error) => void) => void;
    destroy?: (callback: (err?: Error) => void) => void;
}
