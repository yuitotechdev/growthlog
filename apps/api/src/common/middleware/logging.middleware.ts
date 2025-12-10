import { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const authReq = req as AuthRequest;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)${authReq.userId ? ` [User: ${authReq.userId}]` : ''}`);
  });

  next();
};




