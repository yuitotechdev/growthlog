'use client';

import { useInsights } from '../hooks/useInsights';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';

export function InsightList() {
  const { insights, isLoading, error, deleteInsight } = useInsights();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div className="alert alert-error">⚠️ {error}</div>;
  }

  if (insights.length === 0) {
    return (
      <EmptyState
        icon="💡"
        title="まだインサイトがありません"
        description="活動を記録してインサイトを生成しましょう"
      />
    );
  }

  return (
    <div className="insight-list">
      {insights.map((insight) => (
        <div key={insight.id} className="insight-card">
          <div className="insight-header">
            <span className="insight-period">
              📅 {insight.period.startDate} 〜 {insight.period.endDate}
            </span>
            <span className="insight-count">{insight.activityCount}件の活動</span>
          </div>
          
          <div className="insight-content">
            <div className="insight-section">
              <h4>📊 振り返り</h4>
              <p>{insight.summary}</p>
            </div>
            <div className="insight-section">
              <h4>💡 改善提案</h4>
              <p>{insight.advice}</p>
            </div>
          </div>

          <div className="insight-footer">
            <span className="insight-date">
              生成日: {new Date(insight.createdAt).toLocaleDateString('ja-JP')}
            </span>
            <button 
              className="delete-btn"
              onClick={() => deleteInsight(insight.id)}
            >
              🗑️ 削除
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        .insight-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .insight-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
        }
        .insight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .insight-period {
          font-weight: 600;
          color: #6366f1;
        }
        .insight-count {
          font-size: 0.85rem;
          color: #64748b;
          padding: 0.3rem 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 20px;
        }
        .insight-content {
          display: grid;
          gap: 1.25rem;
        }
        .insight-section h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        .insight-section p {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }
        .insight-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .insight-date {
          font-size: 0.8rem;
          color: #94a3b8;
        }
        .delete-btn {
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: none;
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}


