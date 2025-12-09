import { profileRepository } from './profile.repository';
import { BadRequestError, NotFoundError } from '../../common/errors/http.error';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30日

export class ProfileService {
  async getProfile(userId: string) {
    const user = await profileRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    return this.toProfileDto(user);
  }

  async getPublicProfile(uniqueId: string) {
    const user = await profileRepository.findByUniqueId(uniqueId);
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    return {
      uniqueId: user.uniqueId,
      username: user.username,
      avatarEmoji: user.avatarEmoji,
    };
  }

  async updateProfile(userId: string, data: {
    username?: string;
    avatarEmoji?: string | null;
  }) {
    // バリデーション
    if (data.username !== undefined) {
      if (data.username.length < 1 || data.username.length > 50) {
        throw new BadRequestError('表示名は1〜50文字で入力してください');
      }
    }

    // avatarEmojiのバリデーション
    if (data.avatarEmoji !== undefined && data.avatarEmoji !== null) {
      // 絵文字は1文字のみ（一部の絵文字は複数文字で構成されるが、基本的に1つの絵文字として扱う）
      if (data.avatarEmoji.length > 10) {
        throw new BadRequestError('無効な絵文字です');
      }
    }

    const user = await profileRepository.updateProfile(userId, data);
    return this.toProfileDto(user);
  }

  async updateUniqueId(userId: string, uniqueId: string) {
    // バリデーション: 3〜20文字、英数字とアンダースコアのみ
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uniqueId)) {
      throw new BadRequestError('ユーザーIDは3〜20文字の英数字とアンダースコアのみ使用できます');
    }

    // 利用可能かチェック
    const isAvailable = await profileRepository.isUniqueIdAvailable(uniqueId, userId);
    if (!isAvailable) {
      throw new BadRequestError('このユーザーIDは既に使用されています');
    }

    // 1ヶ月以内に変更していないかチェック
    const currentUser = await profileRepository.findById(userId);
    if (currentUser?.uniqueIdChangedAt) {
      const timeSinceLastChange = Date.now() - new Date(currentUser.uniqueIdChangedAt).getTime();
      if (timeSinceLastChange < ONE_MONTH_MS) {
        const daysRemaining = Math.ceil((ONE_MONTH_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000));
        throw new BadRequestError(`ユーザーIDは1ヶ月に1回のみ変更できます。あと${daysRemaining}日後に変更可能です。`);
      }
    }

    const user = await profileRepository.updateUniqueId(userId, uniqueId);
    return this.toProfileDto(user);
  }

  async checkUniqueIdAvailability(uniqueId: string, userId?: string) {
    // バリデーション
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uniqueId)) {
      return { available: false, message: 'ユーザーIDは3〜20文字の英数字とアンダースコアのみ使用できます' };
    }

    const isAvailable = await profileRepository.isUniqueIdAvailable(uniqueId, userId);
    return { 
      available: isAvailable,
      message: isAvailable ? '利用可能です' : 'このユーザーIDは既に使用されています'
    };
  }

  private toProfileDto(user: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
    uniqueId: string | null;
      avatarEmoji: string | null;
    isAdmin: boolean;
    uniqueIdChangedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      uniqueId: user.uniqueId,
      avatarEmoji: user.avatarEmoji,
      isAdmin: user.isAdmin,
      canChangeUniqueId: this.canChangeUniqueId(user.uniqueIdChangedAt),
      createdAt: user.createdAt.toISOString(),
    };
  }

  private canChangeUniqueId(lastChangedAt: Date | null): boolean {
    if (!lastChangedAt) return true;
    return Date.now() - new Date(lastChangedAt).getTime() >= ONE_MONTH_MS;
  }
}

export const profileService = new ProfileService();

