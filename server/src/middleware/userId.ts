import { Request, Response, NextFunction } from 'express';

export const DEFAULT_USER_ID = 'demo-user';

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

/** Resolves userId from query, body, or header; defaults to demo-user */
export function resolveUserId(req: Request, _res: Response, next: NextFunction): void {
  const fromQuery = req.query.userId;
  const fromBody = req.body?.userId;
  const fromHeader = req.headers['x-user-id'];

  const raw =
    (typeof fromQuery === 'string' && fromQuery) ||
    (typeof fromBody === 'string' && fromBody) ||
    (typeof fromHeader === 'string' && fromHeader) ||
    DEFAULT_USER_ID;

  req.userId = raw;
  next();
}
