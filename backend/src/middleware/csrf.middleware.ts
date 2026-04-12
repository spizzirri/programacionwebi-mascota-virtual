import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Tokens = require('csrf');

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private tokens: Tokens;

  constructor() {
    this.tokens = new Tokens();
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/health') {
      return next();
    }

    if (req.method === 'GET') {
      const secret = (req as any).session?.secret;
      if (!secret) {
        return next();
      }
      const csrfToken = this.tokens.create(secret);
      res.setHeader('X-CSRF-Token', csrfToken);
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    if (!csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    const secret = (req as any).session?.secret;
    if (!secret) {
      throw new ForbiddenException('CSRF secret not found in session');
    }

    const isValid = this.tokens.verify(secret, csrfToken);
    if (!isValid) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }
}
