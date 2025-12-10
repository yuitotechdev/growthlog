'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  activityCount: number;
  avgMood: number;
  topCategories: Array<{
    category: string;
    count: number;
    totalMinutes: number;
  }>;
  aiComment: string;
}

export default function WeeklySummaryPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('');

  // 今週の月曜日を計算
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const fetchSummary = async (weekStart?: string) => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const url = weekStart 
        ? `/api/summary/weekly/${weekStart}`
        : '/api/summary/weekly';
      const data = await client.get<WeeklySummary>(url);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'サマリーの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [token]);

  const handleWeekChange = (weekStart: string) => {
    setSelectedWeekStart(weekStart);
    fetchSummary(weekStart);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  };

  const formatWeekRange = (start: string, end: string) => {
    return `${formatDate(start)} 〜 ${formatDate(end)}`;
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="summary-page">
        <div className="alert alert-error">⚠️ {error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="summary-page">
        <EmptyState
          icon="📊"
          title="サマリーがありません"
          description="活動を記録してサマリーを表示しましょう"
        />
      </div>
    );
  }

  const hours = Math.floor(summary.totalMinutes / 60);
  const minutes = summary.totalMinutes % 60;

  return (
    <div className="summary-page">
      <div className="page-header">
        <h1>📊 週次サマリー</h1>
        <p>{formatWeekRange(summary.weekStart, summary.weekEnd)}</p>
      </div>

      {/* 週選択 */}
      <div className="week-selector">
        <label>週を選択:</label>
        <input
          type="date"
          value={selectedWeekStart || getCurrentWeekStart()}
          onChange={(e) => handleWeekChange(e.target.value)}
          className="input"
        />
      </div>

      {/* AIコメント */}
      <div className="ai-comment-card card">
        <div className="ai-comment-header">
          <span className="ai-icon">✨</span>
          <h3>AIからのコメント</h3>
        </div>
        <p className="ai-comment-text">{summary.aiComment}</p>
      </div>

      {/* 統計カード */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{summary.activityCount}</div>
            <div className="stat-label">活動数</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">
              {hours > 0 ? `${hours}時間` : ''}
              {minutes > 0 ? `${minutes}分` : hours === 0 ? '0分' : ''}
            </div>
            <div className="stat-label">合計時間</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">😊</div>
          <div className="stat-content">
            <div className="stat-value">{summary.avgMood.toFixed(1)}</div>
            <div className="stat-label">平均気分</div>
          </div>
        </div>
      </div>

      {/* カテゴリTOP3 */}
      {summary.topCategories.length > 0 && (
        <div className="categories-section">
          <h2>🏆 カテゴリTOP3</h2>
          <div className="categories-list">
            {summary.topCategories.map((cat, index) => {
              const catHours = Math.floor(cat.totalMinutes / 60);
              const catMinutes = cat.totalMinutes % 60;
              return (
                <div key={cat.category} className="category-item card">
                  <div className="category-rank">#{index + 1}</div>
                  <div className="category-info">
                    <h3 className="category-name">{cat.category}</h3>
                    <div className="category-stats">
                      <span className="category-count">{cat.count}回</span>
                      <span className="category-time">
                        {catHours > 0 ? `${catHours}時間` : ''}
                        {catMinutes > 0 ? `${catMinutes}分` : catHours === 0 ? '0分' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* アクション */}
      <div className="actions-section">
        <Link href="/activities?new=true" className="button">
          ➕ 活動を記録する
        </Link>
        <Link href="/insights" className="button button-secondary">
          💡 インサイトを見る
        </Link>
      </div>

      <style jsx>{`
        .summary-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .page-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .page-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .page-header p {
          color: #64748b;
          font-size: 1rem;
        }
        .week-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
        }
        .week-selector label {
          font-weight: 600;
          color: #1e293b;
        }
        .ai-comment-card {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 2px solid rgba(99, 102, 241, 0.2);
        }
        .ai-comment-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .ai-icon {
          font-size: 1.5rem;
        }
        .ai-comment-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #1e293b;
        }
        .ai-comment-text {
          font-size: 1rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
        }
        .stat-icon {
          font-size: 2.5rem;
        }
        .stat-content {
          flex: 1;
        }
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }
        .stat-label {
          font-size: 0.9rem;
          color: #64748b;
        }
        .categories-section {
          margin-bottom: 2.5rem;
        }
        .categories-section h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1e293b;
        }
        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .category-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
        }
        .category-rank {
          font-size: 2rem;
          font-weight: 700;
          color: #6366f1;
          min-width: 3rem;
          text-align: center;
        }
        .category-info {
          flex: 1;
        }
        .category-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }
        .category-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: #64748b;
        }
        .category-count,
        .category-time {
          padding: 0.25rem 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
        }
        .actions-section {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .button {
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }
        .button-secondary {
          background: rgba(0, 0, 0, 0.05);
          color: #64748b;
          box-shadow: none;
        }
        .button-secondary:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .actions-section {
            flex-direction: column;
          }
          .button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

