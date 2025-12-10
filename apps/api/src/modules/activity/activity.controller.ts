import { Response, NextFunction } from 'express';
import { ActivityService } from './activity.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { createActivityRequestSchema, updateActivityRequestSchema } from '@growthlog/shared';
import { BadRequestError } from '../../common/errors/http.error';

export class ActivityController {
  constructor(private service: ActivityService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      // Zodスキーマでバリデーション
      const validatedData = createActivityRequestSchema.parse(req.body);
      const result = await this.service.create(userId, validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return next(new BadRequestError('入力データが不正です'));
      }
      next(error);
    }
  };

  findByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const excludeSamples = req.query.excludeSamples === 'true';
      console.log('[ActivityController] Finding activities for user:', userId, 'excludeSamples:', excludeSamples);
      const result = await this.service.findByUserId(userId, { excludeSamples });
      console.log('[ActivityController] Found activities:', result.length);
      res.json(result);
    } catch (error: any) {
      console.error('[ActivityController] Error finding activities:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        userId: req.userId,
      });
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

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      // Zodスキーマでバリデーション
      const validatedData = updateActivityRequestSchema.parse(req.body);
      const result = await this.service.update(id, userId, validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return next(new BadRequestError('入力データが不正です'));
      }
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


