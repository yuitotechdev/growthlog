import { Response, NextFunction } from 'express';
import { mvpService } from './mvp.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';

export class MvpController {
  generateAndPostMvp = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;

      const result = await mvpService.generateAndPostMvp(userId, groupId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const mvpController = new MvpController();

