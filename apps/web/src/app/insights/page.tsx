'use client';

import { useState } from 'react';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { InsightList } from '@/features/insight/components/InsightList';
import { Toast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function InsightsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { token } = useAuth();

  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError('開始日と終了日を入力してください');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      await client.post('/api/insights', { startDate, endDate });
      setToast({ message: 'インサイトを生成しました！', type: 'success' });
      setStartDate('');
      setEndDate('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message || 'インサイトの生成に失敗しました');
      setToast({ message: err.message || '生成に失敗しました', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="insights-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <h1>💡 インサイト</h1>
        <p>AIがあなたの活動を分析し、成長のヒントを提供します</p>
      </div>

      <div className="generate-card card">
        <h3>✨ 新しいインサイトを生成</h3>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div className="quick-buttons">
          <button onClick={() => setQuickDate(7)} className="quick-btn">過去7日間</button>
          <button onClick={() => setQuickDate(30)} className="quick-btn">過去30日間</button>
        </div>

        <div className="date-inputs">
          <div className="date-field">
            <label>開始日</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </div>
          <span className="date-arrow">→</span>
          <div className="date-field">
            <label>終了日</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
          </div>
        </div>

        <button className="button" onClick={handleGenerate} disabled={isGenerating || !startDate || !endDate}>
          {isGenerating ? '🔄 生成中...' : '🧠 インサイトを生成'}
        </button>
      </div>

      <section className="history-section">
        <h2>📚 過去のインサイト</h2>
        <InsightList />
      </section>

      <style jsx>{`
        .insights-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 2rem;
        }
        .page-header h1 {
          font-size: 2rem;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .page-header p {
          color: #64748b;
          font-size: 0.9rem;
        }
        .generate-card {
          margin-bottom: 2.5rem;
        }
        .generate-card h3 {
          margin-bottom: 1.25rem;
        }
        .quick-buttons {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .quick-btn {
          padding: 0.6rem 1rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 10px;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .quick-btn:hover {
          background: white;
          border-color: #6366f1;
        }
        .date-inputs {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .date-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .date-field label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }
        .date-arrow {
          padding-bottom: 0.75rem;
          color: #94a3b8;
        }
        .history-section h2 {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 640px) {
          .date-inputs {
            flex-direction: column;
          }
          .date-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}


