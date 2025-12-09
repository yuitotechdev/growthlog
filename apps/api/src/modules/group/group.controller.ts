import { Response, NextFunction } from 'express';
import { groupService } from './group.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { BadRequestError } from '../../common/errors/http.error';

export class GroupController {
  // グループ作成
  createGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { name, description, sharedCategories } = req.body;

      if (!name) {
        return next(new BadRequestError('グループ名を入力してください'));
      }

      if (!sharedCategories || !Array.isArray(sharedCategories)) {
        return next(new BadRequestError('共有するカテゴリを選択してください'));
      }

      const group = await groupService.createGroup(userId, {
        name,
        description,
        sharedCategories,
      });
      res.status(201).json(group);
    } catch (error) {
      next(error);
    }
  };

  // グループ一覧取得
  getMyGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const groups = await groupService.getMyGroups(userId);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  };

  // グループ詳細取得
  getGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const group = await groupService.getGroup(groupId, userId);
      res.json(group);
    } catch (error) {
      next(error);
    }
  };

  // 招待コードでグループ情報取得
  getGroupByInviteCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { inviteCode } = req.params;
      const group = await groupService.getGroupByInviteCode(inviteCode);
      res.json(group);
    } catch (error) {
      next(error);
    }
  };

  // グループ更新
  updateGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { name, description } = req.body;
      const group = await groupService.updateGroup(groupId, userId, { name, description });
      res.json(group);
    } catch (error) {
      next(error);
    }
  };

  // 共有カテゴリ更新
  updateSharedCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { categories } = req.body;

      if (!categories || !Array.isArray(categories)) {
        return next(new BadRequestError('共有するカテゴリを選択してください'));
      }

      const group = await groupService.updateSharedCategories(groupId, userId, categories);
      res.json(group);
    } catch (error) {
      next(error);
    }
  };

  // グループ削除
  deleteGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      await groupService.deleteGroup(groupId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // 招待コードで参加
  joinByInviteCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { inviteCode } = req.params;
      const group = await groupService.joinByInviteCode(inviteCode, userId);
      res.json(group);
    } catch (error) {
      next(error);
    }
  };

  // ユーザーIDで招待
  inviteByUniqueId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { uniqueId } = req.body;

      if (!uniqueId) {
        return next(new BadRequestError('ユーザーIDを入力してください'));
      }

      const result = await groupService.inviteByUniqueId(groupId, userId, uniqueId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // グループ退出
  leaveGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      await groupService.leaveGroup(groupId, userId);
      res.json({ message: 'グループを退出しました' });
    } catch (error) {
      next(error);
    }
  };

  // メンバー削除
  removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId, memberId } = req.params;
      await groupService.removeMember(groupId, userId, memberId);
      res.json({ message: 'メンバーを削除しました' });
    } catch (error) {
      next(error);
    }
  };

  // 招待コード再生成
  regenerateInviteCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const result = await groupService.regenerateInviteCode(groupId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const groupController = new GroupController();


