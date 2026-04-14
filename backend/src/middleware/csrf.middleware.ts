import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Tokens = require('csrf');

const CSRF_EXCLUDED_PATHS = ['/auth/login', '/users'];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private tokens = new Tokens();

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/health') {
      return next();
    }

    // Use originalUrl because NestJS strips the prefix in sub-module routing
    const fullPath = req.originalUrl || req.url;

    if (CSRF_EXCLUDED_PATHS.some(p => fullPath.startsWith(p)) && req.method === 'POST') {
      return next();
    }

    const session = (req as any).session;

    if (req.method === 'GET') {
      if (!session) {
        return next();
      }

      if (!session._csrfSecret) {
        session._csrfSecret = this.tokens.secretSync();
      }

      const csrfToken = this.tokens.create(session._csrfSecret);
      res.setHeader('X-CSRF-Token', csrfToken);
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    if (!csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (!session || !session._csrfSecret) {
      throw new ForbiddenException('CSRF secret not found in session');
    }

    const isValid = this.tokens.verify(session._csrfSecret, csrfToken);
    if (!isValid) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }
}
