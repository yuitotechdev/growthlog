import { Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { BadRequestError } from '../../common/errors/http.error';

export class ProfileController {
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const profile = await profileService.getProfile(userId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  };

  getPublicProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { uniqueId } = req.params;
      const profile = await profileService.getPublicProfile(uniqueId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { username, avatarEmoji } = req.body;
      const profile = await profileService.updateProfile(userId, { username, avatarEmoji });
      res.json(profile);
    } catch (error) {
      next(error);
    }
  };

  updateUniqueId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { uniqueId } = req.body;

      if (!uniqueId) {
        return next(new BadRequestError('ユーザーIDを入力してください'));
      }

      const profile = await profileService.updateUniqueId(userId, uniqueId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  };

  checkUniqueIdAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const { uniqueId } = req.params;
      const result = await profileService.checkUniqueIdAvailability(uniqueId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { password } = req.body;

      if (!password) {
        return next(new BadRequestError('パスワードを入力してください'));
      }

      await profileService.deleteAccount(userId, password);
      res.json({ message: 'アカウントが削除されました' });
    } catch (error) {
      next(error);
    }
  };
}

export const profileController = new ProfileController();


