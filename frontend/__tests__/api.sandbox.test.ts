import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { api } from '../src/api';

function mockFetchResponse(payload: unknown, ok = true, status = 200): typeof fetch {
    const response: Partial<Response> = {
        ok,
        status,
        headers: new Headers(),
        json: async () => payload,
    };
    return jest.fn<() => Promise<Partial<Response>>>().mockResolvedValue(response) as unknown as typeof fetch;
}

describe('api sandbox endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('deberia obtener problemas sanitized cuando getSandboxProblems', async () => {
        const problems = [{ _id: 'p1', title: 'T', testCases: [] }];
        global.fetch = mockFetchResponse(problems);

        const result = await api.getSandboxProblems();

        expect(result).toEqual(problems);
    });

    it('deberia obtener detalle de problema cuando getSandboxProblem(id)', async () => {
        const problem = { _id: 'p1', title: 'T', description: 'D', testCases: [] };
        global.fetch = mockFetchResponse({ problem });

        const result = await api.getSandboxProblem('p1');

        expect(result).toEqual({ problem });
        expect((global.fetch as unknown as jest.Mock).mock.calls[0][0]).toContain('/sandbox/problems/p1');
    });

    it('deberia ejecutar codigo cuando runSandboxCode(problemId:string, code)', async () => {
        const response = { results: [], allPassed: true, error: null };
        global.fetch = mockFetchResponse(response);

        const result = await api.runSandboxCode('p1', 'code');

        expect(result).toEqual(response);
        const fetchCall = (global.fetch as unknown as jest.Mock).mock.calls[0];
        expect(fetchCall[0]).toContain('/sandbox/run');
        const opts = fetchCall[1] as RequestInit;
        const body = JSON.parse(opts.body as string);
        expect(body).toEqual({ problemId: 'p1', code: 'code' });
        expect(opts.method).toBe('POST');
    });

    it('deberia listar admin cuando getSandboxProblemsAdmin', async () => {
        const problems = [{ _id: 'p1', title: 'A' }];
        global.fetch = mockFetchResponse({ problems });

        const result = await api.getSandboxProblemsAdmin();

        expect(result).toEqual({ problems });
        const url = (global.fetch as unknown as jest.Mock).mock.calls[0][0] as string;
        expect(url).toContain('/sandbox/problems/admin');
    });

    it('deberia crear problema cuando createSandboxProblem(body)', async () => {
        const problem = { _id: 'p1', title: 'A' };
        global.fetch = mockFetchResponse({ problem });
        const payload = { title: 'A', description: 'D', params: ['x'], testCases: [{ input: [1], expected: 1, sample: true }] };

        const result = await api.createSandboxProblem(payload);

        expect(result).toEqual({ problem });
        const fetchCall = (global.fetch as unknown as jest.Mock).mock.calls[0];
        const opts = fetchCall[1] as RequestInit;
        expect(opts.method).toBe('POST');
        expect(JSON.parse(opts.body as string)).toEqual(payload);
    });

    it('deberia actualizar problema cuando updateSandboxProblem(id, body)', async () => {
        const problem = { _id: 'p1', title: 'B' };
        global.fetch = mockFetchResponse({ problem });

        const result = await api.updateSandboxProblem('p1', { title: 'B' });

        expect(result).toEqual({ problem });
        const fetchCall = (global.fetch as unknown as jest.Mock).mock.calls[0];
        const opts = fetchCall[1] as RequestInit;
        expect(opts.method).toBe('PATCH');
        expect(JSON.parse(opts.body as string)).toEqual({ title: 'B' });
    });

    it('deberia eliminar problema cuando deleteSandboxProblem(id)', async () => {
        global.fetch = mockFetchResponse({ success: true });

        const result = await api.deleteSandboxProblem('p1');

        expect(result).toEqual({ success: true });
        const fetchCall = (global.fetch as unknown as jest.Mock).mock.calls[0];
        const opts = fetchCall[1] as RequestInit;
        expect(opts.method).toBe('DELETE');
    });
});