import OpenAI from 'openai';
import { env } from '../../common/config/env';
import { BadRequestError, NotFoundError } from '../../common/errors/http.error';
import { ActivityRepository } from '../activity/activity.repository';
import { InsightRepository } from './insight.repository';
import { prisma } from '../../common/db/prisma';

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

    const { summary, advice, oneLineSummary, actionItems } = await this.generateAiInsight(activities, userId);

    // actionItemsをJSON文字列として保存
    const insight = await this.insightRepository.create({
      userId,
      summary,
      advice,
      startDate,
      endDate,
      category,
      activityCount: activities.length,
      oneLineSummary,
      actionItems: JSON.stringify(actionItems),
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
  }>, userId: string): Promise<{ summary: string; advice: string; oneLineSummary: string; actionItems: string[] }> {
    const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
    const avgMood = (activities.reduce((sum, a) => sum + a.mood, 0) / activities.length).toFixed(1);

    if (!this.openai) {
      return {
        oneLineSummary: `この期間に${activities.length}件の活動を記録しました（合計${totalMinutes}分）`,
        actionItems: [
          '週ごとに目標を設定してみましょう',
          '継続的に活動を記録することで、自分のパターンが見えてきます',
        ],
        summary: `この期間に${activities.length}件の活動を記録しました。総活動時間は${totalMinutes}分でした。平均気分は${avgMood}/5でした。`,
        advice: '継続的に活動を記録することで、自分のパターンが見えてきます。週ごとに目標を設定してみましょう。',
      };
    }

    try {
      const activitySummary = activities
        .map((a) => `- ${a.title} (${a.category}): ${a.durationMinutes}分, 気分: ${a.mood}/5`)
        .join('\n');

      const startTime = Date.now();
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは行動分析の専門家です。ユーザーの活動ログから建設的なフィードバックを提供してください。',
          },
          {
            role: 'user',
            content: `以下の活動ログを分析して、以下のJSON形式で回答してください。

活動ログ（${activities.length}件、合計${totalMinutes}分、平均気分${avgMood}/5）:
${activitySummary}

回答形式: {
  "oneLineSummary": "1行の要約（30文字程度）",
  "actionItems": ["行動提案1（20文字程度）", "行動提案2（20文字程度）"],
  "summary": "振り返り（100文字程度）",
  "advice": "改善提案（100文字程度）"
}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });
      const duration = Date.now() - startTime;

      // LLM呼び出しログを記録
      try {
        await prisma.systemLog.create({
          data: {
            type: 'llm_call',
            method: 'POST',
            path: '/api/insights',
            userId,
            status: 200,
            duration,
            message: `Insight generation for ${activities.length} activities`,
            metadata: JSON.stringify({
              model: 'gpt-3.5-turbo',
              activityCount: activities.length,
              tokensUsed: completion.usage?.total_tokens || null,
            }),
          },
        });
      } catch (logError) {
        console.error('[InsightService] Failed to save LLM log:', logError);
      }

      const content = completion.choices[0]?.message?.content || '';
      const parsed = JSON.parse(content);

      return {
        oneLineSummary: parsed.oneLineSummary || `この期間に${activities.length}件の活動を記録しました`,
        actionItems: Array.isArray(parsed.actionItems) && parsed.actionItems.length > 0
          ? parsed.actionItems.slice(0, 2) // 最大2個まで
          : ['継続的に活動を記録しましょう', '週ごとに目標を設定してみましょう'],
        summary: parsed.summary || '振り返りを生成できませんでした',
        advice: parsed.advice || '改善提案を生成できませんでした',
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // エラーログを記録
      try {
        await prisma.systemLog.create({
          data: {
            type: 'error',
            method: 'POST',
            path: '/api/insights',
            userId,
            status: 500,
            message: `OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            metadata: JSON.stringify({
              activityCount: activities.length,
              errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            }),
          },
        });
      } catch (logError) {
        console.error('[InsightService] Failed to save error log:', logError);
      }
      
      return {
        oneLineSummary: `この期間に${activities.length}件の活動を記録しました`,
        actionItems: [
          '継続的に活動を記録しましょう',
          '週ごとに目標を設定してみましょう',
        ],
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
    oneLineSummary: string | null;
    actionItems: string | null;
    startDate: string;
    endDate: string;
    category: string | null;
    activityCount: number;
    createdAt: Date;
  }) {
    let parsedActionItems: string[] = [];
    if (insight.actionItems) {
      try {
        parsedActionItems = JSON.parse(insight.actionItems);
      } catch (e) {
        console.error('Failed to parse actionItems:', e);
      }
    }

    return {
      id: insight.id,
      userId: insight.userId,
      summary: insight.summary,
      advice: insight.advice,
      oneLineSummary: insight.oneLineSummary || insight.summary.substring(0, 50),
      actionItems: parsedActionItems,
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


