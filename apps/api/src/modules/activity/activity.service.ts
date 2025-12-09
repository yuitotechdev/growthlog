import { ActivityRepository } from './activity.repository';
import { NotFoundError, BadRequestError } from '../../common/errors/http.error';
import { CreateActivityRequest, UpdateActivityRequest } from '@growthlog/shared';
import { Activity } from '@prisma/client';

export class ActivityService {
  constructor(private repository: ActivityRepository) {}

  async create(userId: string, data: CreateActivityRequest) {
    // バリデーション（Zodで既にチェック済みだが、念のため）
    this.validateMood(data.mood);
    this.validateDate(data.date);
    
    const activity = await this.repository.create({ userId, ...data });
    return this.toDto(activity);
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

  async findByUserId(userId: string) {
    const activities = await this.repository.findByUserId(userId);
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
      createdAt: activity.createdAt.toISOString(),
    };
  }
}


