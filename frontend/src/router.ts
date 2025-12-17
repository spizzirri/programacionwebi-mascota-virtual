import gameView from './views/game.html?raw';
import profileView from './views/profile.html?raw';
import authView from './views/auth.html?raw';
import noAuthView from './views/401.html?raw';
import { AuthManager } from './auth';
import { GameManager } from './game';
import { ProfileManager } from './profile';
import { Navbar } from './navbar';
import { session } from './session';

const routes = {
    '/': {
        html: authView,
        init: [() => new AuthManager()],
        guard: () => true
    },
    '/game': {
        html: gameView,
        init: [() => new GameManager(), () => new Navbar()],
        guard: () => session.isAuthenticated()
    },
    '/profile': {
        html: profileView,
        init: [() => new ProfileManager(), () => new Navbar()],
        guard: () => session.isAuthenticated()
    }
};

async function navigateTo(path: string) {
    const app = document.getElementById('app');
    const route = routes[path as keyof typeof routes];

    if (route && route.guard) {
        const isAllowed = route.guard();

        if (isAllowed) {
            app!.innerHTML = route.html;

            if (route.init) {
                route.init.forEach(f => f());
            }
        } else {
            app!.innerHTML = noAuthView;
        }
    }
}

window.addEventListener('navigate-to', ((e: CustomEvent<{ view: string }>) => {
    window.history.pushState(null, '', `${e?.detail?.view}`);
    navigateTo(`${e?.detail?.view}`);
}) as EventListener);


session.initialize().then(() => {
    const pathname = window.location.pathname;
    navigateTo(pathname === '/index.html' ? '/' : pathname);
});