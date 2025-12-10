import { Response, NextFunction } from 'express';
import { SummaryService } from './summary.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { BadRequestError } from '../../common/errors/http.error';

export class SummaryController {
  constructor(private service: SummaryService) {}

  getWeeklySummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { weekStart } = req.query;

      if (!weekStart || typeof weekStart !== 'string') {
        return next(new BadRequestError('週の開始日を指定してください（YYYY-MM-DD形式）'));
      }

      const summary = await this.service.getWeeklySummary(userId, weekStart);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  };

  getCurrentWeekSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const summary = await this.service.getCurrentWeekSummary(userId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  };
}

