import { Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';

export class AdminController {
  constructor(private service: AdminService) {}

  getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit } = req.query;
      const result = await this.service.getUsers(
        search as string,
        page ? parseInt(page as string, 10) : undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getUserDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.getUserDetails(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  suspendUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.suspendUser(id);
      res.json({ message: 'ユーザーを停止しました' });
    } catch (error) {
      next(error);
    }
  };

  activateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.activateUser(id);
      res.json({ message: 'ユーザーを有効化しました' });
    } catch (error) {
      next(error);
    }
  };

  toggleAdminStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.service.toggleAdminStatus(id);
      res.json({ message: `管理者権限を${user.isAdmin ? '付与' : '解除'}しました` });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.deleteUser(id);
      res.json({ message: 'ユーザーを削除しました' });
    } catch (error) {
      next(error);
    }
  };

  getOverviewStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getOverviewStats();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getActivityStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getActivityStats();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { type, page, limit } = req.query;
      const result = await this.service.getLogs(
        type as string,
        page ? parseInt(page as string, 10) : undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getLogStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getLogStats();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getSettings();
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  updateSetting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const result = await this.service.updateSetting(key, value);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteSetting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      await this.service.deleteSetting(key);
      res.json({ message: '設定を削除しました' });
    } catch (error) {
      next(error);
    }
  };
}



