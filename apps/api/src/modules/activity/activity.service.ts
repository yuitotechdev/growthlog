import { ActivityRepository } from './activity.repository';
import { NotFoundError, BadRequestError } from '../../common/errors/http.error';
import { CreateActivityRequest, UpdateActivityRequest } from '@growthlog/shared';
import { Activity } from '@prisma/client';
import { prisma } from '../../common/db/prisma';

export class ActivityService {
  constructor(private repository: ActivityRepository) {}

  async create(userId: string, data: CreateActivityRequest) {
    // バリデーション（Zodで既にチェック済みだが、念のため）
    this.validateMood(data.mood);
    this.validateDate(data.date);
    
    const activity = await this.repository.create({ userId, ...data });
    
    // ストリークを更新
    await this.updateStreak(userId, data.date);
    
    return this.toDto(activity);
  }
  
  private async updateStreak(userId: string, activityDate: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        streak: true, 
        lastActiveDate: true,
      } as any, // Prisma Client再生成後にanyを削除
    });
    
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const currentStreak: number = ((user as any).streak as number) || 0;
    const currentLastActiveDate: string | null = ((user as any).lastActiveDate as string | null) || null;
    
    let newStreak = currentStreak;
    let newLastActiveDate = activityDate;
    
    // 今日の活動の場合
    if (activityDate === today) {
      // 最後の活動日が昨日の場合、ストリークを継続
      if (currentLastActiveDate === yesterday) {
        newStreak = currentStreak + 1;
      }
      // 最後の活動日が今日の場合、ストリークは変わらない
      else if (currentLastActiveDate === today) {
        newStreak = currentStreak;
      }
      // 最後の活動日が2日以上前の場合、ストリークをリセット
      else if (currentLastActiveDate && currentLastActiveDate < yesterday) {
        newStreak = 1;
      }
      // 初めての活動の場合
      else if (!currentLastActiveDate) {
        newStreak = 1;
      }
    }
    // 過去の活動の場合、ストリークは更新しない（lastActiveDateのみ更新）
    else {
      // 過去の活動で、lastActiveDateより新しい場合は更新
      if (!currentLastActiveDate || activityDate > currentLastActiveDate) {
        newLastActiveDate = activityDate;
      } else {
        newLastActiveDate = currentLastActiveDate;
      }
      newStreak = currentStreak;
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        streak: newStreak,
        lastActiveDate: newLastActiveDate,
      } as any, // Prisma Client再生成後にanyを削除
    });
  }

  private validateMood(mood: number) {
    if (mood < 1 || mood > 5) {
      throw new BadRequestError('気分は1から5の範囲で入力してください');
    }
  }

  private validateDate(date: string) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestError('日付はYYYY-MM-DD形式で入力してください');
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestError('有効な日付を入力してください');
    }
  }

  async findByUserId(userId: string, options?: { excludeSamples?: boolean }) {
    const activities = await this.repository.findByUserId(userId, { excludeSamples: options?.excludeSamples });
    return activities.map(this.toDto);
  }

  async findById(id: string, userId: string) {
    const activity = await this.repository.findById(id, userId);
    if (!activity) {
      throw new NotFoundError('活動が見つかりません');
    }
    return this.toDto(activity);
  }

  async update(id: string, userId: string, data: UpdateActivityRequest) {
    const existing = await this.repository.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('活動が見つかりません');
    }
    
    // バリデーション
    if (data.mood !== undefined) {
      this.validateMood(data.mood);
    }
    if (data.date !== undefined) {
      this.validateDate(data.date);
    }
    
    const activity = await this.repository.update(id, userId, data);
    return this.toDto(activity);
  }

  async delete(id: string, userId: string) {
    const existing = await this.repository.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('活動が見つかりません');
    }
    await this.repository.delete(id, userId);
  }

  private toDto(activity: Activity) {
    return {
      id: activity.id,
      userId: activity.userId,
      title: activity.title,
      category: activity.category,
      durationMinutes: activity.durationMinutes,
      mood: activity.mood,
      note: activity.note,
      date: activity.date,
      isSample: (activity as any).isSample || false, // マイグレーション前でも動作
      createdAt: activity.createdAt.toISOString(),
    };
  }
}


