import { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware';
import { prisma } from '../db/prisma';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const authReq = req as AuthRequest;

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    // コンソールに出力
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)${authReq.userId ? ` [User: ${authReq.userId}]` : ''}`);

    // データベースに保存（非同期で実行、エラーは無視）
    try {
      // ログタイプを判定
      let logType = 'api_call';
      if (res.statusCode >= 500) {
        logType = 'error';
      } else if (req.path.startsWith('/api/auth')) {
        logType = 'auth';
      }

      // メタデータを準備
      const metadata: any = {};
      if (req.query && Object.keys(req.query).length > 0) {
        metadata.query = req.query;
      }
      if (req.body && Object.keys(req.body).length > 0 && !req.path.includes('/auth/login') && !req.path.includes('/auth/signup')) {
        // パスワードなどの機密情報は除外
        const safeBody = { ...req.body };
        if (safeBody.password) delete safeBody.password;
        if (safeBody.token) delete safeBody.token;
        metadata.body = safeBody;
      }

      await prisma.systemLog.create({
        data: {
          type: logType,
          method: req.method,
          path: req.path,
          userId: authReq.userId || null,
          status: res.statusCode,
          duration,
          message: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
          metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      // ログ保存のエラーは無視（ログ機能自体が原因でアプリが止まらないように）
      console.error('[LoggingMiddleware] Failed to save log:', error);
    }
  });

  next();
};




