import { api } from './api';

export async function syncStreakWithWidget() {
    if (typeof window === 'undefined') return;

    try {
        const user = await api.getCurrentUser();
        if (user && 'navigator' in window && 'widgets' in window.navigator) {
            // @ts-ignore - PWA Widgets API might not be in the types yet
            await window.navigator.widgets.updateByTag('streak-widget', {
                data: { streak: user.streak }
            });
        }
    } catch (error) {
        // Only log if it's not a session error (e.g. not logged in)
        if (error instanceof Error && !error.message.includes('Unauthorized')) {
            console.error('Failed to sync streak with widget:', error);
        }
    }
}
