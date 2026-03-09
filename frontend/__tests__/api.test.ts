import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { api } from '../src/api';

describe('apiRequest - manejo de sesion', () => {
    let dispatchEventSpy: jest.SpiedFunction<typeof window.dispatchEvent>;

    beforeEach(() => {
        dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('deberia despachar session-expired y lanzar error cuando el servidor responde 401', async () => {
        const mockFetch = jest.fn<() => Promise<Partial<Response>>>().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => 'Unauthorized',
        });
        global.fetch = mockFetch as unknown as typeof fetch;

        await expect(api.getCurrentUser()).rejects.toThrow('Sesión vencida');

        const dispatchedEvents = dispatchEventSpy.mock.calls.map(([e]) => (e as Event).type);
        expect(dispatchedEvents).toContain('session-expired');
    });

    it('deberia no despachar session-expired y lanzar el mensaje del servidor cuando el login responde 401', async () => {
        const mockFetch = jest.fn<() => Promise<Partial<Response>>>().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ message: 'usuario o contraseña incorrectos' }),
        });
        global.fetch = mockFetch as unknown as typeof fetch;

        await expect(api.login('test@test.com', 'wrong')).rejects.toThrow('usuario o contraseña incorrectos');

        const dispatchedEvents = dispatchEventSpy.mock.calls.map(([e]) => (e as Event).type);
        expect(dispatchedEvents).not.toContain('session-expired');
    });

    it('deberia despachar session-expired cuando un endpoint protegido responde 401', async () => {
        const mockFetch = jest.fn<() => Promise<Partial<Response>>>().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => 'Unauthorized',
        });
        global.fetch = mockFetch as unknown as typeof fetch;

        await expect(api.getRandomQuestion()).rejects.toThrow('Sesión vencida');

        const dispatchedEvents = dispatchEventSpy.mock.calls.map(([e]) => (e as Event).type);
        expect(dispatchedEvents).toContain('session-expired');
    });

    it('deberia lanzar el mensaje de error del servidor cuando el estado no es 401', async () => {
        const mockFetch = jest.fn<() => Promise<Partial<Response>>>().mockResolvedValue({
            ok: false,
            status: 403,
            text: async () => JSON.stringify({ message: 'Acceso denegado' }),
        });
        global.fetch = mockFetch as unknown as typeof fetch;

        await expect(api.getCurrentUser()).rejects.toThrow('Acceso denegado');

        const dispatchedEvents = dispatchEventSpy.mock.calls.map(([e]) => (e as Event).type);
        expect(dispatchedEvents).not.toContain('session-expired');
    });

    it('deberia retornar los datos cuando la respuesta es exitosa', async () => {
        const mockUser = {
            _id: '1',
            email: 'a@b.com',
            role: 'STUDENT',
            streak: 0,
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            createdAt: new Date().toISOString(),
        };

        const mockFetch = jest.fn<() => Promise<Partial<Response>>>().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ user: mockUser }),
        });
        global.fetch = mockFetch as unknown as typeof fetch;

        const user = await api.getCurrentUser();
        expect(user).toEqual(mockUser);
    });
});
