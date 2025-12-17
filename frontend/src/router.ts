import gameView from './views/game.html?raw';
import profileView from './views/profile.html?raw';
import authView from './views/auth.html?raw';
import { AuthManager } from './auth';
import { GameManager } from './game';
import { ProfileManager } from './profile';
import { Navbar } from './navbar';

const routes = {
    '/': {
        html: authView,
        init: [() => new AuthManager()]
    },
    '/game': {
        html: gameView,
        init: [() => new GameManager(), () => new Navbar()]
    },
    '/profile': {
        html: profileView,
        init: [() => new ProfileManager(), () => new Navbar()]
    }
};

function navigateTo(path: string) {
    const app = document.getElementById('app');
    const route = routes[path as keyof typeof routes];

    if (route && app) {
        app.innerHTML = route.html;

        if (route.init) {
            route.init.forEach(f => f());
        }
    }
}

window.addEventListener('navigate-to', ((e: CustomEvent<{ view: string }>) => {
    window.history.pushState(null, '', `/${e?.detail?.view}`);
    navigateTo(`/${e?.detail?.view}`);
}) as EventListener);

navigateTo('/');