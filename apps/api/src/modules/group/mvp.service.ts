import { groupRepository } from './group.repository';
import { sharedActivityService } from './shared-activity.service';
import { chatService } from './chat.service';
import { BadRequestError, ForbiddenError } from '../../common/errors/http.error';
import { env } from '../../common/config/env';
import OpenAI from 'openai';

export class MvpService {
  private openai: OpenAI | null = null;

  constructor() {
    if (env.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: env.openaiApiKey });
    }
  }

  /**
   * 今週のグループMVPを生成してチャットに投稿
   */
  async generateAndPostMvp(userId: string, groupId: string) {
    // オーナー確認
    const isOwner = await groupRepository.isOwner(groupId, userId);
    if (!isOwner) {
      throw new ForbiddenError('MVPを生成する権限がありません（オーナーのみ）');
    }

    // 今週の日付範囲を計算
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (日曜) から 6 (土曜)
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日からの日数
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    // ランキングデータを取得
    const rankings = await sharedActivityService.getMemberRankings(userId, groupId, startDate, endDate);

    if (rankings.byDuration.length === 0) {
      throw new BadRequestError('今週の活動データがありません');
    }

    // AIに称号を生成させる
    const mvpTitle = await this.generateMvpTitle(rankings);

    // チャットに投稿
    const message = await chatService.sendMessage(userId, groupId, mvpTitle);

    return {
      message: 'MVPを生成して投稿しました',
      mvpTitle,
      postedMessage: message,
    };
  }

  /**
   * ランキングデータからAIが称号を生成
   */
  private async generateMvpTitle(rankings: {
    byDuration: Array<{ rank: number; user: any; value: number; label: string }>;
    byCount: Array<{ rank: number; user: any; value: number; label: string }>;
    byMood: Array<{ rank: number; user: any; value: number; label: string }>;
  }): Promise<string> {
    // ランキングデータを整形
    const topByDuration = rankings.byDuration.slice(0, 3).map((r) => ({
      rank: r.rank,
      name: r.user?.username || r.user?.uniqueId || '匿名',
      emoji: r.user?.avatarEmoji || '👤',
      value: r.value,
      label: r.label,
    }));

    const topByCount = rankings.byCount.slice(0, 3).map((r) => ({
      rank: r.rank,
      name: r.user?.username || r.user?.uniqueId || '匿名',
      emoji: r.user?.avatarEmoji || '👤',
      value: r.value,
      label: r.label,
    }));

    const topByMood = rankings.byMood.slice(0, 3).map((r) => ({
      rank: r.rank,
      name: r.user?.username || r.user?.uniqueId || '匿名',
      emoji: r.user?.avatarEmoji || '👤',
      value: r.value,
      label: r.label,
    }));

    const prompt = `以下のランキングデータから、今週のグループMVPを選出し、楽しくて励みになる称号タイトルを生成してください。

【活動時間ランキング】
${topByDuration.map((r) => `${r.rank}位: ${r.emoji} ${r.name} - ${r.label}`).join('\n')}

【活動回数ランキング】
${topByCount.map((r) => `${r.rank}位: ${r.emoji} ${r.name} - ${r.label}`).join('\n')}

【平均気分ランキング】
${topByMood.map((r) => `${r.rank}位: ${r.emoji} ${r.name} - ${r.label}`).join('\n')}

以下の形式で回答してください：
- 1行目: 「🏆 今週のグループMVP 🏆」のような見出し
- 2行目: 空行
- 3行目以降: 各カテゴリの1位を表彰する形式（例: 「⏰ 活動時間の王: @user1 (120分)」）
- 最後に: 励ましのメッセージ（例: 「みんなお疲れ様でした！来週も頑張りましょう🔥」）

楽しくて、メンバーがやる気になるような表現にしてください。絵文字を適切に使ってください。`;

    if (!this.openai) {
      // フォールバック: シンプルなMVPメッセージを生成
      const topUser = topByDuration[0];
      return `🏆 今週のグループMVP 🏆\n\n⏰ 活動時間の王: ${topUser.emoji} ${topUser.name} (${topUser.label})\n\nみんなお疲れ様でした！来週も頑張りましょう🔥`;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたはグループのモチベーションを高める表彰メッセージを生成する専門家です。楽しくて励みになる表現を心がけてください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || '';
      return content.trim() || '🏆 今週のグループMVP 🏆\n\nみんなお疲れ様でした！';
    } catch (error) {
      console.error('[MVP Generation Error]', error);
      // フォールバック: シンプルなMVPメッセージを生成
      const topUser = topByDuration[0];
      return `🏆 今週のグループMVP 🏆\n\n⏰ 活動時間の王: ${topUser.emoji} ${topUser.name} (${topUser.label})\n\nみんなお疲れ様でした！来週も頑張りましょう🔥`;
    }
  }
}

export const mvpService = new MvpService();

