'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ONBOARDING_TEMPLATES, OnboardingTemplate } from '@/features/onboarding/types';
import { Loading } from '@/components/ui/Loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { InsightDto } from '@growthlog/shared';

type OnboardingStep = 'template' | 'samples' | 'insight' | 'delete' | 'guide';

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('template');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<OnboardingTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [insightGenerated, setInsightGenerated] = useState(false);
  const [generatedInsight, setGeneratedInsight] = useState<InsightDto | null>(null);
  const [samplesDeleted, setSamplesDeleted] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  // テンプレートの選択/解除
  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  // ステップ1: テンプレート選択（複数選択対応）
  const handleTemplateSelect = async () => {
    if (selectedTemplates.size === 0) {
      setError('少なくとも1つのテンプレートを選択してください');
      return;
    }

    if (!token) {
      setError('ログインが必要です');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      // 選択されたテンプレートを取得
      const templates = ONBOARDING_TEMPLATES.filter((t) => selectedTemplates.has(t.id));
      
      // カテゴリをマージ（重複を除去）
      const categoryMap = new Map<string, { name: string; emoji: string; color: string }>();
      const allSampleActivities: Array<{
        title: string;
        category: string;
        durationMinutes: number;
        mood: number;
        note?: string;
        date: string;
      }> = [];

      templates.forEach((template) => {
        template.categories.forEach((cat) => {
          if (!categoryMap.has(cat.name)) {
            categoryMap.set(cat.name, cat);
          }
        });
        allSampleActivities.push(...template.sampleActivities);
      });

      const mergedCategories = Array.from(categoryMap.values());

      // テンプレートに基づいてカテゴリとサンプルデータを作成
      await client.post('/api/onboarding/apply-template', {
        templateIds: Array.from(selectedTemplates),
        categories: mergedCategories,
        sampleActivities: allSampleActivities,
      });

      // 最初に選択されたテンプレートを表示用に保存
      setSelectedTemplate(templates[0]);
      setStep('samples');
    } catch (err: any) {
      setError(err.message || 'テンプレートの適用に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ステップ2: サンプルデータ確認 → ステップ3へ
  const handleContinueToInsight = () => {
    setStep('insight');
  };

  // ステップ3: AIインサイト生成
  const handleGenerateInsight = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);

      // インサイトを生成
      await client.post('/api/insights', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });

      // 生成されたインサイトを取得
      const insights = await client.get<InsightDto[]>('/api/insights?limit=1');
      if (insights && insights.length > 0) {
        setGeneratedInsight(insights[0]);
      }

      setInsightGenerated(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'インサイトの生成に失敗しました');
      setIsLoading(false);
    }
  };

  // ステップ4: サンプルデータ削除
  const handleDeleteSamples = async () => {
    if (!token || samplesDeleted) return;

    setIsLoading(true);
    setError('');

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      await client.delete('/api/onboarding/samples');
      setSamplesDeleted(true);
      setIsLoading(false);
      
      // 削除完了後、ガイド画面へ進むボタンを表示
    } catch (err: any) {
      setError(err.message || 'サンプルデータの削除に失敗しました');
      setIsLoading(false);
    }
  };

  // ステップ5: ガイド完了 → ホームへ
  const handleComplete = () => {
    router.push('/?onboarding=complete');
  };

  if (isLoading && step === 'template') {
    return (
      <div className="onboarding-page">
        <div className="loading-container">
          <Loading />
          <p>セットアップ中...</p>
        </div>
        <style jsx>{`
          .onboarding-page {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
          }
          .loading-container {
            text-align: center;
            padding: 4rem 2rem;
          }
          .loading-container p {
            margin-top: 1rem;
            color: #64748b;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      {/* ステップバー */}
      <div className="step-bar">
        <div className={`step ${step === 'template' ? 'active' : step !== 'template' ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">テンプレ選択</div>
        </div>
        <div className={`step ${step === 'samples' ? 'active' : ['insight', 'delete', 'guide'].includes(step) ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">サンプル確認</div>
        </div>
        <div className={`step ${step === 'insight' ? 'active' : ['delete', 'guide'].includes(step) ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">AI体験</div>
        </div>
        <div className={`step ${step === 'delete' ? 'active' : step === 'guide' ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">削除</div>
        </div>
        <div className={`step ${step === 'guide' ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <div className="step-label">完了</div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {/* ステップ1: テンプレート選択 */}
      {step === 'template' && (
        <div className="step-content">
          <div className="onboarding-header">
            <h1>✨ あなたが伸ばしたいのはどれ？</h1>
            <p>選んだ瞬間、カテゴリとサンプルデータが自動で設定されます</p>
          </div>

          <div className="templates-grid">
            {ONBOARDING_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplates.has(template.id) ? 'selected' : ''}`}
                onClick={() => toggleTemplate(template.id)}
              >
                <div className="template-checkbox">
                  {selectedTemplates.has(template.id) ? '✓' : ''}
                </div>
                <div className="template-emoji">{template.emoji}</div>
                <h3 className="template-name">{template.name}</h3>
                <p className="template-description">{template.description}</p>
              </div>
            ))}
          </div>

          <div className="onboarding-actions">
            <p className="selection-hint">
              {selectedTemplates.size > 0 
                ? `${selectedTemplates.size}個のテンプレートを選択中` 
                : '複数のテンプレートを選択できます'}
            </p>
            <button
              className="button button-primary"
              onClick={handleTemplateSelect}
              disabled={selectedTemplates.size === 0 || isLoading}
            >
              {selectedTemplates.size > 0 
                ? `${selectedTemplates.size}個のテンプレートで始める` 
                : 'テンプレートを選択してください'}
            </button>
          </div>
        </div>
      )}

      {/* ステップ2: サンプルデータ確認 */}
      {step === 'samples' && (
        <div className="step-content">
          <div className="onboarding-header">
            <h1>✅ あなたの活動データが入りました</h1>
            <p>サンプル活動が3件追加されました。これを使ってAIインサイトを体験してみましょう</p>
          </div>

          <div className="sample-activities">
            {selectedTemplate && selectedTemplate.sampleActivities.slice(0, 6).map((activity, idx) => (
              <div key={idx} className="sample-activity-card">
                <div className="activity-emoji">{selectedTemplate.categories.find(c => c.name === activity.category)?.emoji || '📝'}</div>
                <div className="activity-info">
                  <h4>{activity.title}</h4>
                  <p>{activity.category} • {activity.durationMinutes}分</p>
                </div>
              </div>
            ))}
            {selectedTemplate && selectedTemplate.sampleActivities.length > 6 && (
              <p className="more-activities-hint">他にも{selectedTemplate.sampleActivities.length - 6}件のサンプル活動があります</p>
            )}
          </div>

          <div className="onboarding-actions">
            <button
              className="button button-primary"
              onClick={handleContinueToInsight}
            >
              AIインサイトを生成してみる ▶
            </button>
          </div>
        </div>
      )}

      {/* ステップ3: AIインサイト体験 */}
      {step === 'insight' && (
        <div className="step-content">
          <div className="onboarding-header">
            <h1>🤖 AIインサイトを体験</h1>
            <p>あなたの活動データを分析して、AIがフィードバックを生成します</p>
          </div>

          {!insightGenerated ? (
            <div className="insight-generate-section">
              <button
                className="button button-primary large"
                onClick={handleGenerateInsight}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loading />
                    <span style={{ marginLeft: '0.5rem' }}>あなたの成長を分析中...</span>
                  </>
                ) : (
                  'AIインサイトを生成してみる ▶'
                )}
              </button>
            </div>
          ) : generatedInsight && !samplesDeleted ? (
            <div className="insight-result-section">
              <div className="insight-preview-header">
                <h2>✨ AIがあなたの活動を分析しました！</h2>
                <p>こんなインサイトが出せるんです</p>
              </div>

              {/* 生成されたインサイトを表示 */}
              <div className="onboarding-insight-card">
                <div className="insight-header">
                  <span className="insight-period">
                    📅 {generatedInsight.period.startDate} 〜 {generatedInsight.period.endDate}
                  </span>
                  <span className="insight-count">{generatedInsight.activityCount}件の活動</span>
                </div>
                
                {/* 1行要約 */}
                <div className="insight-one-line">
                  <span className="one-line-icon">✨</span>
                  <p className="one-line-text">{generatedInsight.oneLineSummary || generatedInsight.summary.substring(0, 50)}</p>
                </div>

                {/* 行動提案 */}
                {generatedInsight.actionItems && generatedInsight.actionItems.length > 0 && (
                  <div className="insight-actions">
                    <h4 className="actions-title">🎯 今すぐできること</h4>
                    <div className="actions-list">
                      {generatedInsight.actionItems.map((item, idx) => (
                        <div key={idx} className="action-item">
                          <span className="action-icon">→</span>
                          <span className="action-text">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 詳細（折りたたみ可能） */}
                <details className="insight-details">
                  <summary className="details-summary">📊 詳細を見る</summary>
                  <div className="insight-content">
                    <div className="insight-section">
                      <h4>📊 振り返り</h4>
                      <p>{generatedInsight.summary}</p>
                    </div>
                    <div className="insight-section">
                      <h4>💡 改善提案</h4>
                      <p>{generatedInsight.advice}</p>
                    </div>
                  </div>
                </details>
              </div>

              <div className="onboarding-actions">
                <button
                  className="button button-primary"
                  onClick={() => setStep('delete')}
                >
                  次へ進む ▶
                </button>
              </div>
            </div>
          ) : samplesDeleted ? (
            <div className="insight-result-section">
              <div className="success-message large">
                <span className="success-icon">✅</span>
                <h2>サンプルデータは削除されました</h2>
                <p className="sub-text">これからはあなたの活動データで成長を記録できます</p>
                <p className="sub-text" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  準備完了画面に移動します...
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ステップ4: サンプルデータ削除 */}
      {step === 'delete' && (
        <div className="step-content">
          <div className="onboarding-header">
            <h1>🗑️ サンプルデータを削除</h1>
            <p>サンプルデータを削除して、あなた専用の記録を始めましょう</p>
          </div>

          {!samplesDeleted ? (
            <>
          {!samplesDeleted ? (
            <>
              <div className="delete-warning">
                <p>⚠️ サンプルデータを削除すると、元に戻せません</p>
                <p>ただし、あなたが追加したデータは残ります</p>
              </div>

              <div className="onboarding-actions">
                <button
                  className="button button-secondary"
                  onClick={() => setStep('guide')}
                >
                  スキップ（後で削除）
                </button>
                <button
                  className="button button-primary"
                  onClick={handleDeleteSamples}
                  disabled={isLoading}
                >
                  {isLoading ? '削除中...' : 'サンプルデータを削除してスタート'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="success-message large">
                <span className="success-icon">✅</span>
                <h2>サンプルデータは削除されました</h2>
                <p className="sub-text">これからはあなたの活動データで成長を記録できます</p>
              </div>

              <div className="onboarding-actions">
                <button
                  className="button button-primary"
                  onClick={() => setStep('guide')}
                >
                  次へ進む ▶
                </button>
              </div>
            </>
          )}
            </>
          ) : (
            <>
              <div className="success-message large">
                <span className="success-icon">✅</span>
                <h2>サンプルデータは削除されました</h2>
                <p className="sub-text">これからはあなたの活動データで成長を記録できます</p>
              </div>

              <div className="onboarding-actions">
                <button
                  className="button button-primary"
                  onClick={() => setStep('guide')}
                >
                  次へ進む ▶
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ステップ5: ガイド完了 */}
      {step === 'guide' && (
        <div className="step-content">
          <div className="onboarding-header">
            <h1>🎉 準備完了！</h1>
            <p>今日の活動を追加してみましょう</p>
          </div>

          <div className="guide-section">
            <div className="guide-item">
              <div className="guide-icon">➕</div>
              <div className="guide-text">
                <h3>右下の「＋」ボタンから</h3>
                <p>いつでも活動を追加できます</p>
              </div>
            </div>
            <div className="guide-item">
              <div className="guide-icon">📊</div>
              <div className="guide-text">
                <h3>AIインサイトで分析</h3>
                <p>定期的にAIがあなたの成長を分析します</p>
              </div>
            </div>
            <div className="guide-item">
              <div className="guide-icon">👥</div>
              <div className="guide-text">
                <h3>グループで共有</h3>
                <p>仲間と一緒に成長を記録できます</p>
              </div>
            </div>
          </div>

          <div className="onboarding-actions">
            <button
              className="button button-primary large"
              onClick={handleComplete}
            >
              始める 🚀
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .onboarding-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
        }

        .step-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          position: relative;
        }

        .step-bar::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(0, 0, 0, 0.1);
          z-index: 0;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.1);
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          transform: scale(1.1);
        }

        .step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-label {
          font-size: 0.75rem;
          color: #64748b;
          text-align: center;
        }

        .step.active .step-label {
          color: #6366f1;
          font-weight: 600;
        }

        .step-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .onboarding-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .onboarding-header h1 {
          font-size: 2rem;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .onboarding-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .template-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(15px);
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
          text-align: center;
        }

        .template-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .template-card.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
        }

        .template-card {
          position: relative;
        }

        .template-checkbox {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 24px;
          height: 24px;
          border: 2px solid #6366f1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          font-size: 1rem;
          color: #6366f1;
          font-weight: bold;
        }

        .template-card.selected .template-checkbox {
          background: #6366f1;
          color: white;
        }

        .template-emoji {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .template-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }

        .template-description {
          color: #64748b;
          font-size: 0.9rem;
        }

        .sample-activities {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .sample-activity-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          border: 2px solid rgba(99, 102, 241, 0.1);
        }

        .activity-emoji {
          font-size: 2rem;
        }

        .activity-info h4 {
          margin: 0 0 0.25rem 0;
          color: #1e293b;
        }

        .activity-info p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .insight-generate-section {
          text-align: center;
          padding: 3rem 0;
        }

        .insight-result-section {
          text-align: center;
        }

        .insight-preview-header {
          margin-bottom: 2rem;
        }

        .insight-preview-header h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }

        .insight-preview-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .onboarding-insight-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(15px);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          text-align: left;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
          animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .insight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .insight-period {
          font-weight: 600;
          color: #6366f1;
          font-size: 0.9rem;
        }

        .insight-count {
          font-size: 0.85rem;
          color: #64748b;
          padding: 0.3rem 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 20px;
        }

        .insight-one-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .one-line-icon {
          font-size: 1.5rem;
        }

        .one-line-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          flex: 1;
        }

        .insight-actions {
          margin-bottom: 1.5rem;
        }

        .actions-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
        }

        .action-icon {
          color: #10b981;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .action-text {
          color: #1e293b;
          font-size: 0.95rem;
        }

        .insight-details {
          margin-top: 1.5rem;
        }

        .details-summary {
          cursor: pointer;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          color: #6366f1;
          list-style: none;
          user-select: none;
          transition: all 0.2s ease;
        }

        .details-summary:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .details-summary::-webkit-details-marker {
          display: none;
        }

        .insight-content {
          display: grid;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }

        .insight-section h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }

        .insight-section p {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.7;
          margin: 0;
        }

        .deleting-message {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(99, 102, 241, 0.05);
          border-radius: 12px;
        }

        .deleting-message p {
          margin-top: 1rem;
          color: #64748b;
          font-size: 0.9rem;
        }

        .success-message {
          padding: 2rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .success-message.large {
          padding: 3rem;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: scaleIn 0.5s ease;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .success-message h2 {
          margin: 0.5rem 0;
          color: #1e293b;
          font-size: 1.5rem;
        }

        .success-message p {
          margin: 0.5rem 0;
          color: #1e293b;
        }

        .sub-text {
          color: #64748b;
          font-size: 1rem;
        }

        .delete-warning {
          padding: 1.5rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 12px;
          margin-bottom: 2rem;
          text-align: center;
        }

        .delete-warning p {
          margin: 0.5rem 0;
          color: #1e293b;
        }

        .guide-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .guide-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
        }

        .guide-icon {
          font-size: 2.5rem;
        }

        .guide-text h3 {
          margin: 0 0 0.25rem 0;
          color: #1e293b;
        }

        .guide-text p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .onboarding-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          justify-content: center;
          padding-top: 2rem;
        }

        .selection-hint {
          text-align: center;
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }

        .button {
          padding: 0.875rem 2rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .button-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .button-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .button-primary.large {
          padding: 1.25rem 3rem;
          font-size: 1.1rem;
        }

        .button-secondary {
          background: rgba(0, 0, 0, 0.05);
          color: #64748b;
        }

        .button-secondary:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.1);
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        @media (max-width: 640px) {
          .templates-grid {
            grid-template-columns: 1fr;
          }
          .onboarding-actions {
            flex-direction: column;
          }
          .button {
            width: 100%;
          }
          .step-label {
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}
