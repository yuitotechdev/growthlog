'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ApiClient } from '@growthlog/shared';
import { Loading } from '@/components/ui/Loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OverviewStats {
  totalUsers: number;
  totalActivities: number;
  totalInsights: number;
  activeUsers: number;
}

interface CategoryStats {
  category: string;
  count: number;
  totalMinutes: number;
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const [overviewData, activityData] = await Promise.all([
        client.get<OverviewStats>('/api/admin/stats/overview'),
        client.get<CategoryStats[]>('/api/admin/stats/activities'),
      ]);

      setOverview(overviewData);
      setCategoryStats(activityData || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) return <Loading />;

  const maxCategoryMinutes = Math.max(...(categoryStats.map(c => c.totalMinutes) || [1]), 1);

  return (
    <div className="admin-analytics-page">
      <div className="page-header">
        <h1>📈 統計・分析</h1>
        <p className="subtitle">アプリケーション全体の利用状況</p>
      </div>

      {/* 概要統計 */}
      <div className="overview-grid">
        <div className="stat-card primary">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">{overview?.totalUsers || 0}</span>
            <span className="stat-label">総ユーザー数</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-content">
            <span className="stat-value">{overview?.totalActivities || 0}</span>
            <span className="stat-label">総活動数</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💡</span>
          <div className="stat-content">
            <span className="stat-value">{overview?.totalInsights || 0}</span>
            <span className="stat-label">総インサイト数</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <span className="stat-icon">🔥</span>
          <div className="stat-content">
            <span className="stat-value">{overview?.activeUsers || 0}</span>
            <span className="stat-label">週間アクティブユーザー</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* カテゴリ別 */}
        <div className="chart-card full-width">
          <h3>🏷️ カテゴリ別活動</h3>
          {categoryStats.length === 0 ? (
            <p className="no-data">データがありません</p>
          ) : (
            <div className="horizontal-bars">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="h-bar-item">
                  <span className="h-bar-label">{cat.category}</span>
                  <div className="h-bar-wrapper">
                    <div
                      className="h-bar"
                      style={{ width: `${(cat.totalMinutes / maxCategoryMinutes) * 100}%` }}
                    />
                  </div>
                  <span className="h-bar-value">{cat.count}回 / {Math.round(cat.totalMinutes / 60)}時間</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-analytics-page {
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: #64748b;
          margin: 0;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-card.primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }

        .stat-card.primary .stat-label {
          color: rgba(255, 255, 255, 0.8);
        }

        .stat-card.highlight {
          border: 2px solid rgba(99, 102, 241, 0.3);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .no-data {
          text-align: center;
          color: #64748b;
          padding: 2rem;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .chart-card h3 {
          margin: 0 0 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .bar-chart {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
          height: 200px;
        }

        .bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .bar-wrapper {
          width: 100%;
          height: 160px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .bar {
          width: 80%;
          min-height: 4px;
          background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 4px 4px 0 0;
          display: flex;
          justify-content: center;
          padding-top: 0.25rem;
          transition: height 0.3s ease;
        }

        .bar-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .bar-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .horizontal-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .h-bar-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .h-bar-label {
          width: 80px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
        }

        .h-bar-wrapper {
          flex: 1;
          height: 24px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .h-bar {
          height: 100%;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 12px;
          transition: width 0.3s ease;
          min-width: 4px;
        }

        .h-bar-value {
          width: 60px;
          text-align: right;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6366f1;
        }

        .top-users-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .top-user-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(99, 102, 241, 0.05);
          border-radius: 12px;
        }

        .rank {
          font-size: 1.25rem;
          min-width: 32px;
          text-align: center;
        }

        .user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.9rem;
        }

        .user-email {
          font-size: 0.75rem;
          color: #64748b;
        }

        .user-count {
          font-weight: 700;
          color: #6366f1;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

