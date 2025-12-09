import { prisma } from '../../common/db/prisma';

export class SharedActivityRepository {
  // 活動をグループに共有
  async shareActivity(groupId: string, activityId: string) {
    return prisma.groupSharedActivity.create({
      data: {
        groupId,
        activityId,
      },
    });
  }

  // 活動の共有を解除
  async unshareActivity(groupId: string, activityId: string) {
    return prisma.groupSharedActivity.delete({
      where: {
        groupId_activityId: {
          groupId,
          activityId,
        },
      },
    });
  }

  // 活動が共有されているグループ一覧
  async getSharedGroups(activityId: string) {
    return prisma.groupSharedActivity.findMany({
      where: { activityId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // グループに共有された活動一覧
  async getSharedActivities(groupId: string, options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    userId?: string;
  }) {
    const where: {
      groupId: string;
      activity?: {
        userId?: string;
        date?: { gte?: string; lte?: string };
        category?: string;
      };
    } = { groupId };

    const activityWhere: {
      userId?: string;
      date?: { gte?: string; lte?: string };
      category?: string;
    } = {};
    if (options?.startDate) activityWhere.date = { ...activityWhere.date, gte: options.startDate };
    if (options?.endDate) activityWhere.date = { ...activityWhere.date, lte: options.endDate };
    if (options?.category) activityWhere.category = options.category;
    if (options?.userId) activityWhere.userId = options.userId;

    return prisma.groupSharedActivity.findMany({
      where: {
        ...where,
        activity: activityWhere,
      },
      include: {
        activity: {
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
      },
      orderBy: {
        activity: {
          date: 'desc',
        },
      },
    });
  }

  // グループメンバーごとの活動サマリー
  async getMemberActivitySummary(groupId: string, startDate: string, endDate: string) {
    const sharedActivities = await prisma.groupSharedActivity.findMany({
      where: {
        groupId,
        activity: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        activity: true,
      },
    });

    // ユーザーごとに集計
    const userSummary: Record<string, {
      userId: string;
      totalMinutes: number;
      activityCount: number;
      averageMood: number;
      categoryBreakdown: Record<string, number>;
    }> = {};

    for (const shared of sharedActivities) {
      const { activity } = shared;
      if (!userSummary[activity.userId]) {
        userSummary[activity.userId] = {
          userId: activity.userId,
          totalMinutes: 0,
          activityCount: 0,
          averageMood: 0,
          categoryBreakdown: {},
        };
      }

      const summary = userSummary[activity.userId];
      summary.totalMinutes += activity.durationMinutes;
      summary.activityCount += 1;
      summary.averageMood = (summary.averageMood * (summary.activityCount - 1) + activity.mood) / summary.activityCount;
      summary.categoryBreakdown[activity.category] = (summary.categoryBreakdown[activity.category] || 0) + activity.durationMinutes;
    }

    return Object.values(userSummary);
  }

  // 活動がグループに共有されているか確認
  async isShared(groupId: string, activityId: string) {
    const shared = await prisma.groupSharedActivity.findUnique({
      where: {
        groupId_activityId: {
          groupId,
          activityId,
        },
      },
    });
    return !!shared;
  }

  // 活動のオーナー確認
  async getActivityOwner(activityId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { userId: true },
    });
    return activity?.userId;
  }

  // グループの共有カテゴリ取得
  async getGroupSharedCategories(groupId: string) {
    const categories = await prisma.groupCategory.findMany({
      where: { groupId },
    });
    return categories.map((c) => c.categoryName);
  }
}

export const sharedActivityRepository = new SharedActivityRepository();


