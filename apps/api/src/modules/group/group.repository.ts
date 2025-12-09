import { prisma } from '../../common/db/prisma';
import { nanoid } from 'nanoid';

export class GroupRepository {
  // グループ作成
  async create(data: {
    name: string;
    description?: string;
    ownerId: string;
    sharedCategories: string[];
  }) {
    const inviteCode = nanoid(10); // 10文字のランダムコード

    return prisma.$transaction(async (tx) => {
      // グループ作成
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
          inviteCode,
        },
      });

      // オーナーをメンバーとして追加
      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: data.ownerId,
          role: 'owner',
        },
      });

      // 共有カテゴリを追加
      if (data.sharedCategories.length > 0) {
        await tx.groupCategory.createMany({
          data: data.sharedCategories.map((categoryName) => ({
            groupId: group.id,
            categoryName,
          })),
        });
      }

      return this.findById(group.id);
    });
  }

  // グループ取得
  async findById(groupId: string) {
    return prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            uniqueId: true,
            avatarEmoji: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                uniqueId: true,
                avatarEmoji: true,
              },
            },
          },
        },
        sharedCategories: true,
      },
    });
  }

  // 招待コードでグループ取得
  async findByInviteCode(inviteCode: string) {
    return prisma.group.findUnique({
      where: { inviteCode },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            uniqueId: true,
            avatarEmoji: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

  // ユーザーが所属するグループ一覧
  async findByUserId(userId: string) {
    return prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            uniqueId: true,
            avatarEmoji: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                uniqueId: true,
                avatarEmoji: true,
              },
            },
          },
        },
        sharedCategories: true,
        _count: {
          select: { members: true, sharedActivities: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // グループ更新
  async update(groupId: string, data: {
    name?: string;
    description?: string;
  }) {
    return prisma.group.update({
      where: { id: groupId },
      data,
    });
  }

  // 共有カテゴリ更新
  async updateSharedCategories(groupId: string, categories: string[]) {
    return prisma.$transaction(async (tx) => {
      // 既存のカテゴリを削除
      await tx.groupCategory.deleteMany({
        where: { groupId },
      });

      // 新しいカテゴリを追加
      if (categories.length > 0) {
        await tx.groupCategory.createMany({
          data: categories.map((categoryName) => ({
            groupId,
            categoryName,
          })),
        });
      }

      return this.findById(groupId);
    });
  }

  // グループ削除
  async delete(groupId: string) {
    return prisma.group.delete({
      where: { id: groupId },
    });
  }

  // メンバー追加
  async addMember(groupId: string, userId: string, role: string = 'member') {
    return prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role,
      },
    });
  }

  // メンバー削除
  async removeMember(groupId: string, userId: string) {
    return prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  // メンバーかどうか確認
  async isMember(groupId: string, userId: string) {
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
    return !!member;
  }

  // オーナーかどうか確認
  async isOwner(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    return group?.ownerId === userId;
  }

  // 招待コード再生成
  async regenerateInviteCode(groupId: string) {
    const newInviteCode = nanoid(10);
    return prisma.group.update({
      where: { id: groupId },
      data: { inviteCode: newInviteCode },
    });
  }

  // ユーザーIDでユーザー検索
  async findUserByUniqueId(uniqueId: string) {
    return prisma.user.findUnique({
      where: { uniqueId },
      select: {
        id: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
      },
    });
  }
}

export const groupRepository = new GroupRepository();


