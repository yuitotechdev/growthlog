'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCategories } from '@/features/category/hooks/useCategories';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Group {
  id: string;
  name: string;
  description: string | null;
  sharedCategories: string[];
}

interface GroupSettingsProps {
  group: Group;
  onUpdate: () => void;
}

export function GroupSettings({ group, onUpdate }: GroupSettingsProps) {
  const { token } = useAuth();
  const { categories = [] } = useCategories();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(group.sharedCategories || []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(group.name);
    setDescription(group.description || '');
    setSelectedCategories(group.sharedCategories || []);
  }, [group]);

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleSave = async () => {
    if (!token) return;

    if (!name.trim()) {
      setError('グループ名を入力してください');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('共有するカテゴリを1つ以上選択してください');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      // グループ基本情報を更新
      await client.put(`/api/groups/${group.id}`, {
        name: name.trim(),
        description: description.trim() || null,
      });

      // 共有カテゴリを更新
      await client.put(`/api/groups/${group.id}/categories`, {
        categories: selectedCategories,
      });

      onUpdate();
    } catch (err: any) {
      setError(err.message || '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="group-settings">
      <h3>⚙️ グループ設定</h3>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="form-section">
        <div className="form-group">
          <label>グループ名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="グループ名"
          />
        </div>

        <div className="form-group">
          <label>説明（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input textarea"
            placeholder="グループの説明"
            rows={3}
          />
        </div>
      </div>

      <div className="form-section">
        <h4>🏷️ 共有するカテゴリ</h4>
        <p className="hint">選択したカテゴリの活動がグループメンバーと共有されます</p>
        
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-btn ${selectedCategories.includes(cat.name) ? 'selected' : ''}`}
              onClick={() => handleCategoryToggle(cat.name)}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
            >
              <span className="cat-emoji">{cat.emoji}</span>
              <span className="cat-name">{cat.name}</span>
              {selectedCategories.includes(cat.name) && <span className="check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="actions">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '💾 設定を保存'}
        </button>
      </div>

      <style jsx>{`
        .group-settings {
          padding: 0.5rem;
        }

        .group-settings h3 {
          margin: 0 0 1.5rem;
          font-size: 1.1rem;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section h4 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
          color: #1e293b;
        }

        .hint {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0 0 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.9rem;
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

        .textarea {
          resize: vertical;
          min-height: 80px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .category-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          font-size: 0.9rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          position: relative;
        }

        .category-btn:hover {
          background: white;
          border-color: var(--cat-color, #6366f1);
        }

        .category-btn.selected {
          border-color: var(--cat-color, #6366f1);
          background: color-mix(in srgb, var(--cat-color, #6366f1) 10%, white);
        }

        .cat-emoji {
          font-size: 1.1rem;
        }

        .cat-name {
          flex: 1;
          text-align: left;
        }

        .check {
          color: var(--cat-color, #6366f1);
          font-weight: bold;
        }

        .actions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .save-btn {
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .save-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}


