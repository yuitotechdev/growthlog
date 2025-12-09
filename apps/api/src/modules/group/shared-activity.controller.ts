import { Response, NextFunction } from 'express';
import { sharedActivityService } from './shared-activity.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { BadRequestError } from '../../common/errors/http.error';

export class SharedActivityController {
  // 活動をグループに共有
  shareActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { activityId, groupId } = req.body;

      if (!activityId || !groupId) {
        return next(new BadRequestError('活動IDとグループIDを指定してください'));
      }

      const result = await sharedActivityService.shareActivity(userId, activityId, groupId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // 活動の共有を解除
  unshareActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { activityId, groupId } = req.body;

      if (!activityId || !groupId) {
        return next(new BadRequestError('活動IDとグループIDを指定してください'));
      }

      const result = await sharedActivityService.unshareActivity(userId, activityId, groupId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // グループに共有された活動一覧
  getSharedActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { startDate, endDate, category, memberId } = req.query;

      const activities = await sharedActivityService.getSharedActivities(userId, groupId, {
        startDate: startDate as string,
        endDate: endDate as string,
        category: category as string,
        memberId: memberId as string,
      });
      res.json(activities);
    } catch (error) {
      next(error);
    }
  };

  // 活動が共有されているグループ一覧
  getActivitySharedGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { activityId } = req.params;

      const groups = await sharedActivityService.getActivitySharedGroups(userId, activityId);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  };

  // メンバーごとの活動サマリー
  getMemberSummaries = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return next(new BadRequestError('開始日と終了日を指定してください'));
      }

      const summaries = await sharedActivityService.getMemberSummaries(
        userId,
        groupId,
        startDate as string,
        endDate as string
      );
      res.json(summaries);
    } catch (error) {
      next(error);
    }
  };

  // メンバーランキング
  getMemberRankings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return next(new BadRequestError('開始日と終了日を指定してください'));
      }

      const rankings = await sharedActivityService.getMemberRankings(
        userId,
        groupId,
        startDate as string,
        endDate as string
      );
      res.json(rankings);
    } catch (error) {
      next(error);
    }
  };
}

export const sharedActivityController = new SharedActivityController();

