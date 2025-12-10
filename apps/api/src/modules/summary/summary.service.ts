import { ActivityRepository } from '../activity/activity.repository';
import { InsightService } from '../insight/insight.service';

export class SummaryService {
  constructor(
    private activityRepository: ActivityRepository,
    private insightService: InsightService
  ) {}

  async getWeeklySummary(userId: string, weekStart: string) {
    // 週の開始日から7日間の期間を計算
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 活動を取得
    const activities = await this.activityRepository.findByUserId(userId, {
      startDate: startDateStr,
      endDate: endDateStr,
    });

    // 集計
    const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
    const activityCount = activities.length;
    const avgMood = activities.length > 0
      ? (activities.reduce((sum, a) => sum + a.mood, 0) / activities.length).toFixed(1)
      : '0';

    // カテゴリ別の集計
    const categoryStats: Record<string, { count: number; totalMinutes: number }> = {};
    for (const activity of activities) {
      if (!categoryStats[activity.category]) {
        categoryStats[activity.category] = { count: 0, totalMinutes: 0 };
      }
      categoryStats[activity.category].count++;
      categoryStats[activity.category].totalMinutes += activity.durationMinutes;
    }

    // カテゴリTOP3を取得
    const topCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        totalMinutes: stats.totalMinutes,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 3);

    // AIの1行コメントを生成（活動がある場合）
    let aiComment = '';
    if (activities.length > 0) {
      try {
        // 最新のインサイトから1行要約を取得
        const insights = await this.insightService.findByUserId(userId, 1);
        if (insights.length > 0 && insights[0].oneLineSummary) {
          aiComment = insights[0].oneLineSummary;
        } else {
          // インサイトがない場合は簡易コメントを生成
          aiComment = `今週は${activityCount}件の活動を記録しました。合計${totalMinutes}分の時間を使いました。`;
        }
      } catch (error) {
        // エラーが発生した場合は簡易コメント
        aiComment = `今週は${activityCount}件の活動を記録しました。`;
      }
    } else {
      aiComment = '今週はまだ活動が記録されていません。';
    }

    return {
      weekStart: startDateStr,
      weekEnd: endDateStr,
      totalMinutes,
      activityCount,
      avgMood: parseFloat(avgMood),
      topCategories,
      aiComment,
    };
  }

  async getCurrentWeekSummary(userId: string) {
    // 今週の月曜日を計算
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = 日曜日, 1 = 月曜日, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 日曜日の場合は-6、それ以外は1-dayOfWeek
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekStart = monday.toISOString().split('T')[0];
    return this.getWeeklySummary(userId, weekStart);
  }
}

