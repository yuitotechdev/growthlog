import { Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { ForbiddenError } from '../errors/http.error';
import type { AuthRequest } from './auth.middleware';

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ForbiddenError('認証が必要です');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new ForbiddenError('管理者権限が必要です');
    }

    next();
  } catch (error) {
    next(error);
  }
};




