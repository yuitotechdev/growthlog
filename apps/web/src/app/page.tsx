'use client';

import { useActivities } from '@/features/activity/hooks/useActivities';
import { useInsights } from '@/features/insight/hooks/useInsights';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { StatCard } from '@/components/ui/StatCard';
import { Loading } from '@/components/ui/Loading';
import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const { token, isLoading: authLoading } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const { activities, isLoading: activitiesLoading } = useActivities();
  const { insights, isLoading: insightsLoading } = useInsights(1);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  if (authLoading) {
    return <Loading />;
  }

  if (!token) {
    return (
      <div className="auth-container">
        <div className="hero-section card">
          <div className="hero-content">
            <span className="hero-icon">📈</span>
            <h1 className="hero-title">GrowthLogで日々の成長を記録しよう</h1>
            <p className="hero-subtitle">
              活動ログ、AIフィードバック、目標設定で、あなたの毎日をより豊かに。
            </p>
          </div>
          <div className="auth-forms">
            <div className="auth-toggle">
              <button
                className={`toggle-button ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                ログイン
              </button>
              <button
                className={`toggle-button ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                新規登録
              </button>
            </div>
            {authMode === 'login' ? <LoginForm /> : <SignUpForm />}
          </div>
        </div>

        <style jsx>{`
          .auth-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 150px);
          }
          .hero-section {
            max-width: 500px;
            width: 100%;
            text-align: center;
          }
          .hero-content {
            margin-bottom: 2rem;
          }
          .hero-icon {
            font-size: 3rem;
            display: block;
            margin-bottom: 1rem;
          }
          .hero-title {
            font-size: 1.75rem;
            margin-bottom: 0.75rem;
            background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .hero-subtitle {
            color: #64748b;
            font-size: 0.95rem;
          }
          .auth-toggle {
            display: flex;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 12px;
            padding: 0.25rem;
            margin-bottom: 1.5rem;
          }
          .toggle-button {
            flex: 1;
            padding: 0.75rem;
            border: none;
            border-radius: 10px;
            background: transparent;
            font-size: 0.9rem;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
          }
          .toggle-button.active {
            background: white;
            color: #6366f1;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    );
  }

  const todayActivities = activities.filter((a) => a.date === today);
  const totalDurationToday = todayActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
  const avgMood = todayActivities.length > 0
    ? (todayActivities.reduce((sum, a) => sum + a.mood, 0) / todayActivities.length).toFixed(1)
    : 'N/A';

  return (
    <div className="dashboard">
      <section className="stats-section">
        <h2>🚀 今日のダッシュボード</h2>
        <div className="stats-grid">
          <StatCard icon="📝" label="今日の活動数" value={todayActivities.length} unit="件" />
          <StatCard icon="⏱️" label="今日の活動時間" value={totalDurationToday} unit="分" />
          <StatCard icon="😊" label="今日の平均気分" value={avgMood} />
        </div>
        <Link href="/activities?new=true" className="button">
          ➕ 今すぐ記録
        </Link>
      </section>

      {!activitiesLoading && todayActivities.length === 0 && (
        <div className="empty-card">
          <span className="empty-icon">📝</span>
          <h3>まだ活動が記録されていません</h3>
          <p>最初の活動を記録して、成長の一歩を踏み出しましょう！</p>
          <Link href="/activities?new=true" className="button">
            活動を記録する
          </Link>
        </div>
      )}

      {!insightsLoading && insights.length > 0 && (
        <section className="insights-section">
          <h2>💡 最新のインサイト</h2>
          <div className="insight-preview card">
            <p className="insight-summary">{insights[0].summary}</p>
            <p className="insight-advice">{insights[0].advice}</p>
            <Link href="/insights" className="see-more">
              すべてのインサイトを見る →
            </Link>
          </div>
        </section>
      )}

      <style jsx>{`
        .dashboard {
          max-width: 900px;
          margin: 0 auto;
        }
        .stats-section, .insights-section {
          margin-bottom: 2.5rem;
        }
        .stats-section h2, .insights-section h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .empty-card {
          text-align: center;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
        }
        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }
        .empty-card h3 {
          margin-bottom: 0.5rem;
        }
        .empty-card p {
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        .insight-preview {
          padding: 1.5rem;
        }
        .insight-summary {
          font-size: 1.1rem;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }
        .insight-advice {
          color: #64748b;
          margin-bottom: 1rem;
        }
        .see-more {
          color: #6366f1;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}


