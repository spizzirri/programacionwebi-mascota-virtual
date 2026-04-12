import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CsrfMiddleware } from './csrf.middleware';
import { Request, Response, NextFunction } from 'express';

describe('CsrfMiddleware', () => {
    let middleware: CsrfMiddleware;

    beforeEach(() => {
        middleware = new CsrfMiddleware();
    });

    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });

    describe('use', () => {
        it('should skip CSRF check for /health endpoint', () => {
            const req = {
                path: '/health',
                method: 'GET',
                session: { secret: 'test-secret' },
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            middleware.use(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should attach CSRF token to GET request response headers', () => {
            const req = {
                path: '/api/test',
                method: 'GET',
                session: { secret: 'test-secret' },
            } as unknown as Request;

            const res = {
                setHeader: jest.fn(),
            } as unknown as Response;

            const next = jest.fn();

            middleware.use(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('X-CSRF-Token', expect.any(String));
            expect(next).toHaveBeenCalled();
        });

        it('should skip CSRF token generation if no session secret', () => {
            const req = {
                path: '/api/test',
                method: 'GET',
                session: {},
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            middleware.use(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should reject POST request without CSRF token', () => {
            const req = {
                path: '/api/test',
                method: 'POST',
                headers: {},
                session: { secret: 'test-secret' },
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            expect(() => middleware.use(req, res, next)).toThrow(ForbiddenException);
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject POST request with invalid CSRF token', () => {
            const req = {
                path: '/api/test',
                method: 'POST',
                headers: {
                    'x-csrf-token': 'invalid-token',
                },
                session: { secret: 'test-secret' },
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            expect(() => middleware.use(req, res, next)).toThrow(ForbiddenException);
            expect(next).not.toHaveBeenCalled();
        });

        it('should accept POST request with valid CSRF token', () => {
            const secret = 'test-secret';
            const tokens = require('csrf').Tokens();
            const validToken = tokens.create(secret);

            const req = {
                path: '/api/test',
                method: 'POST',
                headers: {
                    'x-csrf-token': validToken,
                },
                session: { secret },
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            middleware.use(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should reject PATCH request without CSRF token', () => {
            const req = {
                path: '/api/test',
                method: 'PATCH',
                headers: {},
                session: { secret: 'test-secret' },
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            expect(() => middleware.use(req, res, next)).toThrow(ForbiddenException);
        });

        it('should reject DELETE request without CSRF token', () => {
            const req = {
                path: '/api/test',
                method: 'DELETE',
                headers: {},
                session: { secret: 'test-secret' },
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            expect(() => middleware.use(req, res, next)).toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when session has no secret for POST', () => {
            const req = {
                path: '/api/test',
                method: 'POST',
                headers: {
                    'x-csrf-token': 'some-token',
                },
                session: {},
            } as unknown as Request;

            const res = {} as Response;
            const next = jest.fn();

            expect(() => middleware.use(req, res, next)).toThrow(ForbiddenException);
        });
    });
});
