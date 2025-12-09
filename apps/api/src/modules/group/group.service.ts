import { groupRepository } from './group.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/http.error';
import { prisma } from '../../common/db/prisma';

export class GroupService {
  // グループ作成
  async createGroup(userId: string, data: {
    name: string;
    description?: string;
    sharedCategories: string[];
  }) {
    if (!data.name || data.name.length < 1 || data.name.length > 100) {
      throw new BadRequestError('グループ名は1〜100文字で入力してください');
    }

    if (data.sharedCategories.length === 0) {
      throw new BadRequestError('共有するカテゴリを1つ以上選択してください');
    }

    const group = await groupRepository.create({
      name: data.name,
      description: data.description,
      ownerId: userId,
      sharedCategories: data.sharedCategories,
    });

    return this.toGroupDto(group);
  }

  // グループ一覧取得
  async getMyGroups(userId: string) {
    const groups = await groupRepository.findByUserId(userId);
    return groups.map((g) => this.toGroupDto(g)).filter((g) => g !== null);
  }

  // グループ詳細取得
  async getGroup(groupId: string, userId: string) {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('グループが見つかりません');
    }

    // メンバーかどうか確認
    const isMember = await groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('このグループにアクセスする権限がありません');
    }

    return this.toGroupDto(group);
  }

  // 招待コードでグループ情報取得（参加前プレビュー）
  async getGroupByInviteCode(inviteCode: string) {
    const group = await groupRepository.findByInviteCode(inviteCode);
    if (!group) {
      throw new NotFoundError('招待コードが無効です');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      owner: group.owner,
      memberCount: group._count.members,
    };
  }

  // グループ更新
  async updateGroup(groupId: string, userId: string, data: {
    name?: string;
    description?: string;
  }) {
    const isOwner = await groupRepository.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenError('グループを編集する権限がありません');
    }

    if (data.name !== undefined && (data.name.length < 1 || data.name.length > 100)) {
      throw new BadRequestError('グループ名は1〜100文字で入力してください');
    }

    await groupRepository.update(groupId, data);
    const group = await groupRepository.findById(groupId);
    return this.toGroupDto(group);
  }

  // 共有カテゴリ更新
  async updateSharedCategories(groupId: string, userId: string, categories: string[]) {
    const isOwner = await groupRepository.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenError('共有カテゴリを編集する権限がありません');
    }

    if (categories.length === 0) {
      throw new BadRequestError('共有するカテゴリを1つ以上選択してください');
    }

    const group = await groupRepository.updateSharedCategories(groupId, categories);
    return this.toGroupDto(group);
  }

  // グループ削除
  async deleteGroup(groupId: string, userId: string) {
    const isOwner = await groupRepository.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenError('グループを削除する権限がありません');
    }

    await groupRepository.delete(groupId);
  }

  // 招待コードで参加
  async joinByInviteCode(inviteCode: string, userId: string) {
    const group = await groupRepository.findByInviteCode(inviteCode);
    if (!group) {
      throw new NotFoundError('招待コードが無効です');
    }

    // 既にメンバーかチェック
    const isMember = await groupRepository.isMember(group.id, userId);
    if (isMember) {
      throw new BadRequestError('既にこのグループに参加しています');
    }

    await groupRepository.addMember(group.id, userId);
    
    // グループの共有カテゴリをメンバーに同期
    await this.syncCategoriesForMember(group.id, group.ownerId, userId);
    
    const updatedGroup = await groupRepository.findById(group.id);
    return this.toGroupDto(updatedGroup);
  }

  // ユーザーIDで招待
  async inviteByUniqueId(groupId: string, ownerUserId: string, targetUniqueId: string) {
    const isOwner = await groupRepository.isOwner(groupId, ownerUserId);
    if (!isOwner) {
      throw new ForbiddenError('メンバーを招待する権限がありません');
    }

    const targetUser = await groupRepository.findUserByUniqueId(targetUniqueId);
    if (!targetUser) {
      throw new NotFoundError('ユーザーが見つかりません');
    }

    // 既にメンバーかチェック
    const isMember = await groupRepository.isMember(groupId, targetUser.id);
    if (isMember) {
      throw new BadRequestError('このユーザーは既にグループに参加しています');
    }

    await groupRepository.addMember(groupId, targetUser.id);
    
    // グループの共有カテゴリをメンバーに同期
    await this.syncCategoriesForMember(groupId, ownerUserId, targetUser.id);
    
    return { message: 'ユーザーを招待しました', user: targetUser };
  }

  // メンバー退出（自分で退出）
  async leaveGroup(groupId: string, userId: string) {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('グループが見つかりません');
    }

    if (group.ownerId === userId) {
      throw new BadRequestError('オーナーはグループを退出できません。グループを削除してください。');
    }

    const isMember = await groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new BadRequestError('このグループに参加していません');
    }

    await groupRepository.removeMember(groupId, userId);
  }

  // メンバー削除（オーナーが削除）
  async removeMember(groupId: string, ownerUserId: string, targetUserId: string) {
    const isOwner = await groupRepository.isOwner(groupId, ownerUserId);
    if (!isOwner) {
      throw new ForbiddenError('メンバーを削除する権限がありません');
    }

    if (ownerUserId === targetUserId) {
      throw new BadRequestError('オーナーは自分自身を削除できません');
    }

    const isMember = await groupRepository.isMember(groupId, targetUserId);
    if (!isMember) {
      throw new BadRequestError('このユーザーはグループに参加していません');
    }

    await groupRepository.removeMember(groupId, targetUserId);
  }

  // 招待コード再生成
  async regenerateInviteCode(groupId: string, userId: string) {
    const isOwner = await groupRepository.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenError('招待コードを再生成する権限がありません');
    }

    const group = await groupRepository.regenerateInviteCode(groupId);
    return { inviteCode: group.inviteCode };
  }

  // グループの共有カテゴリをメンバーに同期
  private async syncCategoriesForMember(groupId: string, ownerId: string, memberId: string) {
    try {
      // グループの共有カテゴリ名を取得
      const sharedCategories = await prisma.groupCategory.findMany({
        where: { groupId },
      });

      if (sharedCategories.length === 0) return;

      const categoryNames = sharedCategories.map((c) => c.categoryName);

      // オーナーのカテゴリ情報を取得（名前、絵文字、色）
      const ownerCategories = await prisma.category.findMany({
        where: {
          userId: ownerId,
          name: { in: categoryNames },
        },
      });

      // 新メンバーの既存カテゴリを取得
      const memberCategories = await prisma.category.findMany({
        where: { userId: memberId },
      });
      const memberCategoryNames = memberCategories.map((c) => c.name);

      // 新メンバーの現在の最大sortOrder
      const maxSortOrder = Math.max(...memberCategories.map((c) => c.sortOrder), -1);

      // メンバーにない共有カテゴリを追加
      let sortOrderOffset = 0;
      for (const ownerCat of ownerCategories) {
        if (!memberCategoryNames.includes(ownerCat.name)) {
          await prisma.category.create({
            data: {
              userId: memberId,
              name: ownerCat.name,
              emoji: ownerCat.emoji,
              color: ownerCat.color,
              isDefault: false,
              sortOrder: maxSortOrder + 1 + sortOrderOffset,
            },
          });
          sortOrderOffset++;
        }
      }
    } catch (error) {
      console.error('Error syncing categories for member:', error);
      // カテゴリ同期に失敗してもグループ参加は成功させる
    }
  }

  private toGroupDto(group: {
    id: string;
    name: string;
    description: string | null;
    inviteCode: string;
    owner: {
      id: string;
      username: string | null;
      uniqueId: string;
      avatarEmoji: string | null;
    };
    members?: Array<{
      id: string;
      user: {
        id: string;
        username: string | null;
        uniqueId: string;
        avatarEmoji: string | null;
      };
      role: string;
      joinedAt: Date;
    }>;
    sharedCategories?: Array<{
      categoryName: string;
    }>;
    _count?: {
      members?: number;
      sharedActivities?: number;
    };
    createdAt: Date;
  } | null) {
    if (!group) return null;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      owner: group.owner,
      members: group.members?.map((m) => ({
        id: m.id,
        user: m.user,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })) || [],
      sharedCategories: group.sharedCategories?.map((c) => c.categoryName) || [],
      memberCount: group._count?.members || group.members?.length || 0,
      activityCount: group._count?.sharedActivities || 0,
      createdAt: group.createdAt.toISOString(),
    };
  }
}

export const groupService = new GroupService();

