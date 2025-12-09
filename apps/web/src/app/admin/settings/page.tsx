'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ApiClient } from '@growthlog/shared';
import { Loading } from '@/components/ui/Loading';
import { Toast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS = [
  { key: 'ai_model', label: 'AIモデル', type: 'select', options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
  { key: 'ai_max_tokens', label: '最大トークン数', type: 'number' },
  { key: 'ai_temperature', label: 'Temperature', type: 'number', step: 0.1, min: 0, max: 2 },
  { key: 'ai_system_prompt', label: 'システムプロンプト', type: 'textarea' },
  { key: 'max_insights_per_user', label: 'インサイト生成上限/ユーザー', type: 'number' },
];

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      const data = await client.get<SystemSetting[]>('/api/admin/settings');
      const settingsMap: Record<string, string> = {};
      
      // 既存の設定をマップに追加
      data?.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      
      // デフォルト設定が存在しない場合は空文字列を設定
      DEFAULT_SETTINGS.forEach((defaultSetting) => {
        if (!(defaultSetting.key in settingsMap)) {
          settingsMap[defaultSetting.key] = '';
        }
      });
      
      setSettings(settingsMap);
      setOriginalSettings({ ...settingsMap });
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setToast({ message: err.message || '設定の取得に失敗しました', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    if (!token) {
      setToast({ message: '認証が必要です', type: 'error' });
      return;
    }

    const value = settings[key];
    if (value === undefined) {
      setToast({ message: '保存する値がありません', type: 'error' });
      return;
    }

    try {
      setIsSaving(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      
      const setting = DEFAULT_SETTINGS.find((s) => s.key === key);
      const label = setting?.label || key;
      
      await client.put(`/api/admin/settings/${key}`, { value: String(value) });
      setOriginalSettings((prev) => ({ ...prev, [key]: String(value) }));
      setToast({ message: `${label} を保存しました`, type: 'success' });
    } catch (err: any) {
      console.error('Error saving setting:', err);
      const errorMessage = err.message || err.response?.data?.message || '保存に失敗しました';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!token) {
      setToast({ message: '認証が必要です', type: 'error' });
      return;
    }

    const changedKeys = Object.keys(settings).filter(
      (k) => settings[k] !== originalSettings[k] && settings[k] !== undefined
    );

    if (changedKeys.length === 0) {
      setToast({ message: '変更された設定がありません', type: 'error' });
      return;
    }

    try {
      setIsSaving(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const errors: string[] = [];
      
      for (const key of changedKeys) {
        try {
          await client.put(`/api/admin/settings/${key}`, { value: String(settings[key]) });
        } catch (err: any) {
          const setting = DEFAULT_SETTINGS.find((s) => s.key === key);
          const label = setting?.label || key;
          errors.push(`${label}: ${err.message || '保存失敗'}`);
        }
      }

      if (errors.length > 0) {
        setToast({ 
          message: `一部の設定の保存に失敗しました: ${errors.join(', ')}`, 
          type: 'error' 
        });
      } else {
        setOriginalSettings({ ...settings });
        setToast({ message: `${changedKeys.length}件の設定を保存しました`, type: 'success' });
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      const errorMessage = err.message || err.response?.data?.message || '保存に失敗しました';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(settings).some((k) => settings[k] !== originalSettings[k]);

  if (isLoading) return <Loading />;

  return (
    <div className="admin-settings-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="page-header">
        <div>
          <h1>⚙️ 設定</h1>
          <p className="subtitle">システム設定とAIパラメータ</p>
        </div>
        {hasChanges && (
          <button className="save-all-btn" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? '保存中...' : '💾 すべて保存'}
          </button>
        )}
      </div>

      <div className="settings-grid">
        {/* AI設定 */}
        <div className="settings-card">
          <h2>🤖 AI設定</h2>
          
          {DEFAULT_SETTINGS.filter((s) => s.key.startsWith('ai_')).map((setting) => (
            <div key={setting.key} className="setting-item">
              <label>{setting.label}</label>
              {setting.type === 'select' ? (
                <select
                  value={settings[setting.key] || ''}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="input"
                >
                  {setting.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : setting.type === 'textarea' ? (
                <textarea
                  value={settings[setting.key] || ''}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="input textarea"
                  rows={3}
                />
              ) : (
                <input
                  type={setting.type}
                  value={settings[setting.key] || ''}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="input"
                  step={setting.step}
                  min={setting.min}
                  max={setting.max}
                />
              )}
              <div className="setting-actions">
                {settings[setting.key] !== originalSettings[setting.key] && (
                  <span className="changed-badge">変更あり</span>
                )}
                {settings[setting.key] !== originalSettings[setting.key] && (
                  <button
                    className="save-item-btn"
                    onClick={() => handleSave(setting.key)}
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* アプリ設定 */}
        <div className="settings-card">
          <h2>📱 アプリ設定</h2>
          
          {DEFAULT_SETTINGS.filter((s) => !s.key.startsWith('ai_')).map((setting) => (
            <div key={setting.key} className="setting-item">
              <label>{setting.label}</label>
              <input
                type={setting.type}
                value={settings[setting.key] || ''}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                className="input"
              />
              <div className="setting-actions">
                {settings[setting.key] !== originalSettings[setting.key] && (
                  <span className="changed-badge">変更あり</span>
                )}
                {settings[setting.key] !== originalSettings[setting.key] && (
                  <button
                    className="save-item-btn"
                    onClick={() => handleSave(setting.key)}
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 現在の設定値一覧 */}
        <div className="settings-card">
          <h2>📋 すべての設定</h2>
          <div className="settings-list">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="setting-row">
                <span className="setting-key">{key}</span>
                <span className="setting-value">{value.length > 50 ? value.slice(0, 50) + '...' : value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-settings-page {
          max-width: 1000px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .save-all-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
        }

        .save-all-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        .save-all-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .settings-card h2 {
          margin: 0 0 1.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .setting-item {
          margin-bottom: 1.25rem;
          position: relative;
        }

        .setting-item label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
        }

        .input.textarea {
          resize: vertical;
          min-height: 80px;
        }

        select.input {
          cursor: pointer;
        }

        .setting-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          justify-content: flex-end;
        }

        .changed-badge {
          font-size: 0.65rem;
          padding: 0.2rem 0.4rem;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border-radius: 4px;
          font-weight: 600;
        }

        .save-item-btn {
          padding: 0.4rem 0.8rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .save-item-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .save-item-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(99, 102, 241, 0.05);
          border-radius: 8px;
          gap: 1rem;
        }

        .setting-key {
          font-weight: 600;
          color: #6366f1;
          font-size: 0.85rem;
        }

        .setting-value {
          font-size: 0.85rem;
          color: #475569;
          text-align: right;
          word-break: break-all;
        }

        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .save-all-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}


