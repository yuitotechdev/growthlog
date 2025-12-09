import { sharedActivityRepository } from './shared-activity.repository';
import { groupRepository } from './group.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/http.error';
import { prisma } from '../../common/db/prisma';

export class SharedActivityService {
  // 活動をグループに共有
  async shareActivity(userId: string, activityId: string, groupId: string) {
    console.log(`[ShareActivity] userId=${userId}, activityId=${activityId}, groupId=${groupId}`);
    
    // 活動のオーナー確認
    const activityOwnerId = await sharedActivityRepository.getActivityOwner(activityId);
    console.log(`[ShareActivity] activityOwnerId=${activityOwnerId}`);
    if (activityOwnerId !== userId) {
      throw new ForbiddenError('この活動を共有する権限がありません');
    }

    // グループメンバー確認
    const isMember = await groupRepository.isMember(groupId, userId);
    console.log(`[ShareActivity] isMember=${isMember}`);
    if (!isMember) {
      throw new ForbiddenError('このグループに共有する権限がありません');
    }

    // 活動のカテゴリ確認
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });
    console.log(`[ShareActivity] activity.category=${activity?.category}`);
    if (!activity) {
      throw new NotFoundError('活動が見つかりません');
    }

    // グループの共有カテゴリに含まれているか確認
    const sharedCategories = await sharedActivityRepository.getGroupSharedCategories(groupId);
    console.log(`[ShareActivity] sharedCategories=${JSON.stringify(sharedCategories)}`);
    console.log(`[ShareActivity] category match=${sharedCategories.includes(activity.category)}`);
    if (!sharedCategories.includes(activity.category)) {
      throw new BadRequestError(`この活動のカテゴリ「${activity.category}」はグループで共有対象に設定されていません（対象: ${sharedCategories.join(', ')}）`);
    }

    // 既に共有されているか確認
    const isShared = await sharedActivityRepository.isShared(groupId, activityId);
    console.log(`[ShareActivity] isShared=${isShared}`);
    if (isShared) {
      throw new BadRequestError('この活動は既に共有されています');
    }

    await sharedActivityRepository.shareActivity(groupId, activityId);
    console.log(`[ShareActivity] Success!`);
    return { message: '活動を共有しました' };
  }

  // 活動の共有を解除
  async unshareActivity(userId: string, activityId: string, groupId: string) {
    // 活動のオーナー確認
    const activityOwnerId = await sharedActivityRepository.getActivityOwner(activityId);
    if (activityOwnerId !== userId) {
      throw new ForbiddenError('この活動の共有を解除する権限がありません');
    }

    // 共有されているか確認
    const isShared = await sharedActivityRepository.isShared(groupId, activityId);
    if (!isShared) {
      throw new BadRequestError('この活動は共有されていません');
    }

    await sharedActivityRepository.unshareActivity(groupId, activityId);
    return { message: '共有を解除しました' };
  }

  // グループに共有された活動一覧
  async getSharedActivities(userId: string, groupId: string, options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    memberId?: string;
  }) {
    // グループメンバー確認
    const isMember = await groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('このグループにアクセスする権限がありません');
    }

    const sharedActivities = await sharedActivityRepository.getSharedActivities(groupId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      category: options?.category,
      userId: options?.memberId,
    });

    return sharedActivities.map((sa) => ({
      id: sa.id,
      sharedAt: sa.sharedAt.toISOString(),
      activity: {
        id: sa.activity.id,
        title: sa.activity.title,
        category: sa.activity.category,
        durationMinutes: sa.activity.durationMinutes,
        mood: sa.activity.mood,
        note: sa.activity.note,
        date: sa.activity.date,
        user: sa.activity.user,
      },
    }));
  }

  // 活動が共有されているグループ一覧
  async getActivitySharedGroups(userId: string, activityId: string) {
    // 活動のオーナー確認
    const activityOwnerId = await sharedActivityRepository.getActivityOwner(activityId);
    if (activityOwnerId !== userId) {
      throw new ForbiddenError('この情報にアクセスする権限がありません');
    }

    const sharedGroups = await sharedActivityRepository.getSharedGroups(activityId);
    return sharedGroups.map((sg) => ({
      groupId: sg.group.id,
      groupName: sg.group.name,
      sharedAt: sg.sharedAt.toISOString(),
    }));
  }

  // メンバーごとの活動サマリー
  async getMemberSummaries(userId: string, groupId: string, startDate: string, endDate: string) {
    // グループメンバー確認
    const isMember = await groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('このグループにアクセスする権限がありません');
    }

    const summaries = await sharedActivityRepository.getMemberActivitySummary(groupId, startDate, endDate);

    // ユーザー情報を取得
    const userIds = summaries.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return summaries.map((summary) => ({
      user: userMap.get(summary.userId),
      totalMinutes: summary.totalMinutes,
      activityCount: summary.activityCount,
      averageMood: Math.round(summary.averageMood * 10) / 10,
      categoryBreakdown: summary.categoryBreakdown,
    }));
  }

  // メンバーランキング取得
  async getMemberRankings(userId: string, groupId: string, startDate: string, endDate: string) {
    const isMember = await groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('このグループにアクセスする権限がありません');
    }

    const summaries = await sharedActivityRepository.getMemberActivitySummary(groupId, startDate, endDate);
    
    // ユーザー情報を取得
    const userIds = summaries.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // ランキングを計算
    const withUsers = summaries.map((s) => ({
      ...s,
      user: userMap.get(s.userId),
    }));

    // 活動時間ランキング
    const byDuration = [...withUsers].sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    // 活動回数ランキング
    const byCount = [...withUsers].sort((a, b) => b.activityCount - a.activityCount);
    
    // 平均気分ランキング
    const byMood = [...withUsers].sort((a, b) => b.averageMood - a.averageMood);

    return {
      byDuration: byDuration.map((item, index) => ({
        rank: index + 1,
        user: item.user,
        value: item.totalMinutes,
        label: `${item.totalMinutes}分`,
      })),
      byCount: byCount.map((item, index) => ({
        rank: index + 1,
        user: item.user,
        value: item.activityCount,
        label: `${item.activityCount}回`,
      })),
      byMood: byMood.map((item, index) => ({
        rank: index + 1,
        user: item.user,
        value: Math.round(item.averageMood * 10) / 10,
        label: `${(Math.round(item.averageMood * 10) / 10).toFixed(1)}/5`,
      })),
    };
  }
}

export const sharedActivityService = new SharedActivityService();

