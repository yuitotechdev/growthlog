import { OnboardingRepository } from './onboarding.repository';
import { CategoryRepository } from '../category/category.repository';
import { ActivityRepository } from '../activity/activity.repository';

export class OnboardingService {
  constructor(
    private repository: OnboardingRepository,
    private categoryRepository: CategoryRepository,
    private activityRepository: ActivityRepository
  ) {}

  async applyTemplate(
    userId: string,
    data: {
      templateIds?: string[]; // 複数選択対応
      templateId?: string; // 単一選択（後方互換性）
      categories: Array<{ name: string; emoji: string; color: string }>;
      sampleActivities: Array<{
        title: string;
        category: string;
        durationMinutes: number;
        mood: number;
        note?: string;
        date: string;
      }>;
    }
  ) {
    // 既存のカテゴリを削除（デフォルトカテゴリも含む）
    const existingCategories = await this.categoryRepository.findByUserId(userId);
    for (const category of existingCategories) {
      await this.categoryRepository.delete(category.id);
    }

    // テンプレートのカテゴリを作成
    const createdCategories = [];
    for (let i = 0; i < data.categories.length; i++) {
      const cat = data.categories[i];
      const category = await this.categoryRepository.create({
        userId,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        isDefault: true,
        sortOrder: i,
      });
      createdCategories.push(category);
    }

    // サンプル活動を作成
    const createdActivities = [];
    const errors: string[] = [];
    
    for (const activity of data.sampleActivities) {
      // カテゴリ名が存在することを確認
      const categoryExists = createdCategories.some((c) => c.name === activity.category);
      if (!categoryExists) {
        const errorMsg = `Category ${activity.category} not found for activity ${activity.title}`;
        console.warn(`[Onboarding] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }

      try {
        console.log(`[Onboarding] Creating sample activity: ${activity.title} (category: ${activity.category})`);
        const created = await this.activityRepository.create({
          userId,
          title: activity.title,
          category: activity.category,
          durationMinutes: activity.durationMinutes,
          mood: activity.mood,
          note: activity.note,
          date: activity.date,
          isSample: true, // サンプルデータとしてマーク
        });
        createdActivities.push(created);
        console.log(`[Onboarding] Successfully created sample activity: ${activity.title} (id: ${created.id})`);
      } catch (error: any) {
        const errorMsg = `Failed to create activity "${activity.title}": ${error.message || error.code || 'Unknown error'}`;
        console.error(`[Onboarding] ${errorMsg}`, {
          error: error.message,
          code: error.code,
          meta: error.meta,
          stack: error.stack,
        });
        errors.push(errorMsg);
        // サンプル活動の作成に失敗しても続行（他の活動は作成される）
      }
    }

    // すべての活動の作成に失敗した場合はエラーをスロー
    if (createdActivities.length === 0 && data.sampleActivities.length > 0) {
      const errorMessage = `すべてのサンプル活動の作成に失敗しました。エラー: ${errors.join('; ')}`;
      console.error(`[Onboarding] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // 一部の活動の作成に失敗した場合は警告をログに記録
    if (errors.length > 0 && createdActivities.length > 0) {
      console.warn(`[Onboarding] ${errors.length}件のサンプル活動の作成に失敗しましたが、${createdActivities.length}件は成功しました`);
    }

    return {
      categories: createdCategories,
      activities: createdActivities,
      message: 'テンプレートが適用されました',
    };
  }

  async checkNeedsOnboarding(userId: string): Promise<boolean> {
    // 活動が0件の場合はオンボーディングが必要
    const activityCount = await this.repository.getActivityCount(userId);
    return activityCount === 0;
  }

  async deleteSampleActivities(userId: string) {
    return this.activityRepository.deleteSamples(userId);
  }
}

