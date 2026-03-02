import gameView from './views/game.html?raw';
import profileView from './views/profile.html?raw';
import authView from './views/auth.html?raw';
import adminUsersView from './views/admin-users.html?raw';
import adminQuestionsView from './views/admin-questions.html?raw';
import noAuthView from './views/401.html?raw';
import myAppealsView from './views/my-appeals.html?raw';
import adminAppealsView from './views/admin-appeals.html?raw';
import { AuthView } from './views/auth';
import { GameView } from './views/game';
import { ProfileView } from './views/profile';
import { AdminUsersView } from './views/admin-users';
import { AdminQuestionsView } from './views/admin-questions';
import { MyAppealsView } from './views/my-appeals';
import { AdminAppealsView } from './views/admin-appeals';
import { session } from './session';

let currentView: (AuthView | GameView | ProfileView | AdminUsersView | AdminQuestionsView | MyAppealsView | AdminAppealsView)[] = [];

const routes = {
    '/': {
        html: authView,
        init: [() => new AuthView()],
        guard: () => true
    },
    '/game': {
        html: gameView,
        init: [() => new GameView()],
        guard: () => session.isAuthenticated()
    },
    '/profile': {
        html: profileView,
        init: [() => new ProfileView()],
        guard: () => session.isAuthenticated()
    },
    '/admin-users': {
        html: adminUsersView,
        init: [() => new AdminUsersView()],
        guard: () => session.isAuthenticated() && session.getUser()?.role === 'PROFESSOR'
    },
    '/admin-questions': {
        html: adminQuestionsView,
        init: [() => new AdminQuestionsView()],
        guard: () => session.isAuthenticated() && session.getUser()?.role === 'PROFESSOR'
    },
    '/my-appeals': {
        html: myAppealsView,
        init: [() => new MyAppealsView()],
        guard: () => session.isAuthenticated() && session.getUser()?.role === 'STUDENT'
    },
    '/admin-appeals': {
        html: adminAppealsView,
        init: [() => new AdminAppealsView()],
        guard: () => session.isAuthenticated() && session.getUser()?.role === 'PROFESSOR'
    }
};

async function navigateTo(path: string) {
    const app = document.getElementById('app');

    let route = routes[path as keyof typeof routes];
    let params: Record<string, string> = {};

    if (!route) {
        const profileMatch = path.match(/^\/profile\/([^/]+)$/);
        if (profileMatch) {
            route = routes['/profile'];
            params.id = profileMatch[1];
        }
    }

    currentView.forEach(view => {
        if (view.destroy) {
            view.destroy();
        }
    });
    currentView = [];

    if (route && route.guard) {
        const isAllowed = route.guard();

        if (isAllowed) {
            app!.innerHTML = route.html;

            if (route.init) {
                route.init.forEach(f => {
                    const view = f();
                    if ((view as any).setParams) {
                        (view as any).setParams(params);
                    }
                    currentView.push(view);
                });
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