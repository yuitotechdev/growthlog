import { Response, NextFunction } from 'express';
import { InsightService } from './insight.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { BadRequestError } from '../../common/errors/http.error';

export class InsightController {
  constructor(private service: InsightService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { startDate, endDate, category } = req.body;

      if (!startDate || !endDate) {
        return next(new BadRequestError('開始日と終了日を入力してください'));
      }

      const result = await this.service.generateInsight(userId, startDate, endDate, category);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  findByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const result = await this.service.findByUserId(userId, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const result = await this.service.findById(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      await this.service.delete(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}


