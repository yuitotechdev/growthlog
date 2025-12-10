import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/http.error';
import { prisma } from '../db/prisma';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('認証トークンがありません');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };

    // ユーザーの停止状態をチェック
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isSuspended: true },
    });

    if (!user) {
      throw new UnauthorizedError('ユーザーが見つかりません');
    }

    if (user.isSuspended) {
      throw new ForbiddenError('このアカウントは停止されています');
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('無効なトークンです'));
    } else {
      next(error);
    }
  }
};




