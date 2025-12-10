import { Response, NextFunction } from 'express';
import { OnboardingService } from './onboarding.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { BadRequestError } from '../../common/errors/http.error';

export class OnboardingController {
  constructor(private service: OnboardingService) {}

  applyTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { templateId, templateIds, categories, sampleActivities } = req.body;

      if ((!templateId && !templateIds) || !categories || !sampleActivities) {
        return next(new BadRequestError('テンプレートID、カテゴリ、サンプル活動データが必要です'));
      }

      console.log('[Onboarding] Applying template for user:', userId);
      console.log('[Onboarding] Categories:', categories?.length);
      console.log('[Onboarding] Sample activities:', sampleActivities?.length);

      const result = await this.service.applyTemplate(userId, {
        templateId,
        templateIds,
        categories,
        sampleActivities,
      });

      console.log('[Onboarding] Template applied successfully');
      res.status(201).json(result);
    } catch (error: any) {
      console.error('[Onboarding Error]', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        userId: req.userId,
      });
      next(error);
    }
  };

  checkOnboardingStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const needsOnboarding = await this.service.checkNeedsOnboarding(userId);
      res.json({ needsOnboarding });
    } catch (error) {
      next(error);
    }
  };

  deleteSampleActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      await this.service.deleteSampleActivities(userId);
      res.json({ message: 'サンプルデータを削除しました' });
    } catch (error) {
      next(error);
    }
  };
}

