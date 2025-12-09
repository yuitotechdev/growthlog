import OpenAI from 'openai';
import { env } from '../../common/config/env';
import { BadRequestError, NotFoundError } from '../../common/errors/http.error';
import { ActivityRepository } from '../activity/activity.repository';
import { InsightRepository } from './insight.repository';

export class InsightService {
  private openai: OpenAI | null = null;

  constructor(
    private activityRepository: ActivityRepository,
    private insightRepository: InsightRepository
  ) {
    if (env.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: env.openaiApiKey });
    }
  }

  async generateInsight(userId: string, startDate: string, endDate: string, category?: string) {
    if (startDate > endDate) {
      throw new BadRequestError('開始日は終了日より前である必要があります');
    }

    const activities = await this.activityRepository.findByUserId(userId, {
      startDate,
      endDate,
      categories: category ? [category] : undefined,
    });

    if (activities.length === 0) {
      throw new BadRequestError('指定された期間に活動がありません');
    }

    const { summary, advice } = await this.generateAiInsight(activities);

    const insight = await this.insightRepository.create({
      userId,
      summary,
      advice,
      startDate,
      endDate,
      category,
      activityCount: activities.length,
    });

    return this.toDto(insight);
  }

  async findByUserId(userId: string, limit?: number) {
    const insights = await this.insightRepository.findByUserId(userId, limit);
    return insights.map(this.toDto);
  }

  async findById(id: string, userId: string) {
    const insight = await this.insightRepository.findById(id, userId);
    if (!insight) {
      throw new NotFoundError('インサイトが見つかりません');
    }
    return this.toDto(insight);
  }

  async delete(id: string, userId: string) {
    const existing = await this.insightRepository.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('インサイトが見つかりません');
    }
    await this.insightRepository.delete(id, userId);
  }

  private async generateAiInsight(activities: Array<{
    title: string;
    category: string;
    durationMinutes: number;
    mood: number;
    date: string;
  }>): Promise<{ summary: string; advice: string }> {
    if (!this.openai) {
      return {
        summary: `この期間に${activities.length}件の活動を記録しました。総活動時間は${activities.reduce((sum, a) => sum + a.durationMinutes, 0)}分でした。`,
        advice: '継続的に活動を記録することで、自分のパターンが見えてきます。週ごとに目標を設定してみましょう。',
      };
    }

    try {
      const activitySummary = activities
        .map((a) => `- ${a.title} (${a.category}): ${a.durationMinutes}分, 気分: ${a.mood}/5`)
        .join('\n');

      const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
      const avgMood = (activities.reduce((sum, a) => sum + a.mood, 0) / activities.length).toFixed(1);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは行動分析の専門家です。ユーザーの活動ログから建設的なフィードバックを提供してください。',
          },
          {
            role: 'user',
            content: `以下の活動ログを分析して、簡潔な振り返りと改善提案をJSON形式で回答してください。

活動ログ（${activities.length}件、合計${totalMinutes}分、平均気分${avgMood}/5）:
${activitySummary}

回答形式: { "summary": "振り返り（100文字程度）", "advice": "改善提案（100文字程度）" }`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || '';
      const parsed = JSON.parse(content);

      return {
        summary: parsed.summary || '振り返りを生成できませんでした',
        advice: parsed.advice || '改善提案を生成できませんでした',
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        summary: `この期間に${activities.length}件の活動を記録しました。`,
        advice: 'AI分析は現在利用できませんが、記録を続けることで成長が見えてきます。',
      };
    }
  }

  private toDto(insight: {
    id: string;
    userId: string;
    summary: string;
    advice: string;
    startDate: string;
    endDate: string;
    category: string | null;
    activityCount: number;
    createdAt: Date;
  }) {
    return {
      id: insight.id,
      userId: insight.userId,
      summary: insight.summary,
      advice: insight.advice,
      period: {
        startDate: insight.startDate,
        endDate: insight.endDate,
      },
      category: insight.category,
      activityCount: insight.activityCount,
      createdAt: insight.createdAt.toISOString(),
    };
  }
}


