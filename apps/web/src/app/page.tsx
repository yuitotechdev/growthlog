'use client';

import { useActivities } from '@/features/activity/hooks/useActivities';
import { useInsights } from '@/features/insight/hooks/useInsights';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { StatCard } from '@/components/ui/StatCard';
import { Loading } from '@/components/ui/Loading';
import { FabGuide } from '@/components/FabGuide';
import { GroupIntroPopup } from '@/components/GroupIntroPopup';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '@growthlog/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// useSearchParams()を使用するコンポーネントを分離
function OnboardingCompleteHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('onboarding') === 'complete') {
      localStorage.setItem('onboarding_complete', 'true');
      // URLからパラメータを削除
      router.replace('/');
    }
  }, [searchParams, router]);

  return null;
}

export default function HomePage() {
  const { token, isLoading: authLoading } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const { activities, isLoading: activitiesLoading } = useActivities({ excludeSamples: true });
  const { insights, isLoading: insightsLoading } = useInsights(1);
  const { profile, isLoading: profileLoading } = useProfile();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();
  
  // チュートリアル再開の提案（チュートリアル完了済みで、まだ閉じていない場合）
  // フックのルールに従い、すべてのフックを条件分岐の前に配置
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [tutorialPromptDismissed, setTutorialPromptDismissed] = useState(false);

  // 初回ユーザーチェック
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!token || authLoading) return;
      
      try {
        const client = new ApiClient({
          baseUrl: API_BASE_URL,
          getToken: () => token,
        });
        const response = await client.get<{ needsOnboarding: boolean }>('/api/onboarding/status');
        
        if (response.needsOnboarding) {
          router.push('/onboarding');
        }
      } catch (err) {
        // エラーが発生した場合はスキップ
        console.error('Failed to check onboarding status:', err);
      }
    };

    checkOnboardingStatus();
  }, [token, authLoading, router]);

  // チュートリアルプロンプトの表示制御
  useEffect(() => {
    if (typeof window !== 'undefined' && token) {
      const onboardingComplete = localStorage.getItem('onboarding_complete') === 'true';
      const dismissed = localStorage.getItem('tutorial_prompt_dismissed') === 'true';
      setTutorialPromptDismissed(dismissed);
      setShowTutorialPrompt(onboardingComplete && !dismissed && !activitiesLoading);
    }
  }, [token, activitiesLoading]);

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

  const handleDismissTutorialPrompt = () => {
    localStorage.setItem('tutorial_prompt_dismissed', 'true');
    setTutorialPromptDismissed(true);
    setShowTutorialPrompt(false);
  };

  return (
    <>
      <Suspense fallback={null}>
        <OnboardingCompleteHandler />
      </Suspense>
      <FabGuide />
      <GroupIntroPopup />
      <div className="dashboard">
        {/* チュートリアル再開の提案 */}
        {showTutorialPrompt && (
          <div className="tutorial-prompt">
            <div className="tutorial-prompt-content">
              <span className="tutorial-prompt-icon">📚</span>
              <div className="tutorial-prompt-text">
                <h3 className="tutorial-prompt-title">チュートリアルを見ますか？</h3>
                <p className="tutorial-prompt-subtitle">アプリの使い方を確認して、より効果的に活用しましょう</p>
              </div>
              <div className="tutorial-prompt-actions">
                <button
                  className="tutorial-prompt-button"
                  onClick={() => router.push('/onboarding')}
                >
                  チュートリアルを開始
                </button>
                <button
                  className="tutorial-prompt-dismiss"
                  onClick={handleDismissTutorialPrompt}
                  aria-label="閉じる"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ストリーク表示 */}
        {!profileLoading && profile && profile.streak > 0 && (
          <div className="streak-banner">
            <span className="streak-icon">🔥</span>
            <div className="streak-content">
              <h3 className="streak-title">連続{profile.streak}日記録中！</h3>
              <p className="streak-subtitle">毎日の記録を続けましょう</p>
            </div>
          </div>
        )}

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
            <div className="insight-preview-one-line">
              <span className="preview-icon">✨</span>
              <p className="preview-one-line-text">
                {insights[0].oneLineSummary || insights[0].summary.substring(0, 50)}
              </p>
            </div>
            {insights[0].actionItems && insights[0].actionItems.length > 0 && (
              <div className="insight-preview-actions">
                {insights[0].actionItems.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="preview-action-item">
                    <span className="preview-action-icon">→</span>
                    <span className="preview-action-text">{item}</span>
                  </div>
                ))}
              </div>
            )}
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
        .tutorial-prompt {
          margin-bottom: 2rem;
        }
        .tutorial-prompt-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px;
        }
        .tutorial-prompt-icon {
          font-size: 2.5rem;
        }
        .tutorial-prompt-text {
          flex: 1;
        }
        .tutorial-prompt-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }
        .tutorial-prompt-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
        }
        .tutorial-prompt-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tutorial-prompt-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
          white-space: nowrap;
        }
        .tutorial-prompt-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }
        .tutorial-prompt-dismiss {
          width: 32px;
          height: 32px;
          padding: 0;
          background: rgba(0, 0, 0, 0.05);
          color: #64748b;
          border: none;
          border-radius: 50%;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tutorial-prompt-dismiss:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #1e293b;
        }
        @media (max-width: 640px) {
          .tutorial-prompt-content {
            flex-direction: column;
            text-align: center;
          }
          .tutorial-prompt-actions {
            width: 100%;
            justify-content: space-between;
          }
          .tutorial-prompt-button {
            flex: 1;
          }
        }
        .streak-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%);
          border: 2px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          margin-bottom: 2rem;
        }
        .streak-icon {
          font-size: 2.5rem;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .streak-content {
          flex: 1;
        }
        .streak-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }
        .streak-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
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
        .insight-preview-one-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border-radius: 12px;
          margin-bottom: 1rem;
        }
        .preview-icon {
          font-size: 1.5rem;
        }
        .preview-one-line-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          flex: 1;
        }
        .insight-preview-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .preview-action-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
        }
        .preview-action-icon {
          color: #10b981;
          font-weight: 600;
        }
        .preview-action-text {
          color: #1e293b;
          font-size: 0.9rem;
        }
        .see-more {
          color: #6366f1;
          font-weight: 600;
          display: inline-block;
          margin-top: 0.5rem;
        }
      `}</style>
      </div>
    </>
  );
}


