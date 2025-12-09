'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiClient, ActivityDto } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCategories } from '@/features/category/hooks/useCategories';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GroupForShare {
  id: string;
  name: string;
  sharedCategories: string[];
}

interface ActivityFormProps {
  onSuccess?: (activity?: ActivityDto) => void;
}

const moodOptions = [
  { value: 1, emoji: '😢', label: '悪い' },
  { value: 2, emoji: '😐', label: 'やや悪い' },
  { value: 3, emoji: '🙂', label: '普通' },
  { value: 4, emoji: '😊', label: '良い' },
  { value: 5, emoji: '😄', label: 'とても良い' },
];

export function ActivityForm({ onSuccess }: ActivityFormProps) {
  const { categories = [], isLoading: categoriesLoading } = useCategories();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<GroupForShare[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    durationMinutes: 30,
    mood: 3,
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  // グループ一覧を取得
  const fetchGroups = useCallback(async () => {
    if (!token) return;
    try {
      const client = new ApiClient({ baseUrl: API_BASE_URL, getToken: () => token });
      const data = await client.get<GroupForShare[]>('/api/groups');
      setGroups(data || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [categories, formData.category]);

  // 選択したカテゴリで共有可能なグループをフィルタ
  const eligibleGroups = groups.filter((g) => {
    if (!g.sharedCategories || !formData.category) return false;
    // カテゴリ名の完全一致でチェック
    return g.sharedCategories.some((cat) => cat === formData.category);
  });

  // 共有可能なグループが変わったら自動で全選択
  useEffect(() => {
    if (eligibleGroups.length > 0) {
      setSelectedGroups(eligibleGroups.map((g) => g.id));
    } else {
      setSelectedGroups([]);
    }
  }, [formData.category, groups.length]);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData.category) return;

    setIsSubmitting(true);
    setError('');

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const activity = await client.post<ActivityDto>('/api/activities', formData);
      
      // 選択したグループに共有
      const shareErrors: string[] = [];
      for (const groupId of selectedGroups) {
        try {
          console.log('Sharing activity', activity.id, 'to group', groupId);
          await client.post('/api/shared-activities', {
            activityId: activity.id,
            groupId,
          });
          console.log('Successfully shared to group', groupId);
        } catch (err: any) {
          console.error('Error sharing to group:', groupId, err);
          shareErrors.push(err.message || 'Unknown error');
        }
      }
      
      if (shareErrors.length > 0) {
        console.warn('Some shares failed:', shareErrors);
      }

      setFormData({
        title: '',
        category: categories.length > 0 ? categories[0].name : '',
        durationMinutes: 30,
        mood: 3,
        note: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedGroups([]);

      onSuccess?.(activity);
    } catch (err: any) {
      setError(err.message || '活動の記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="activity-form card">
      <h3>📝 新しい活動を記録</h3>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="form-grid">
        <div className="form-field">
          <label>タイトル</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="何をしましたか？"
            className="input"
            required
          />
        </div>

        <div className="form-field">
          <label>カテゴリ</label>
          {categoriesLoading ? (
            <div className="loading-text">読み込み中...</div>
          ) : (
            <div className="category-select">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-btn ${formData.category === cat.name ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  style={{ '--cat-color': cat.color } as React.CSSProperties}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
              <a href="/settings/categories" className="customize-btn">
                ⚙️ カスタマイズ
              </a>
            </div>
          )}
        </div>

        <div className="form-field">
          <label>活動時間: {formData.durationMinutes}分</label>
          <input
            type="range"
            min="5"
            max="480"
            step="5"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
            className="slider"
          />
        </div>

        <div className="form-field">
          <label>気分</label>
          <div className="mood-select">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`mood-btn ${formData.mood === option.value ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, mood: option.value })}
                title={option.label}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>日付</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="input"
            required
          />
        </div>

        <div className="form-field full-width">
          <label>メモ（任意）</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="詳細を記録..."
            className="input"
            rows={3}
          />
        </div>

        {groups.length > 0 && (
          <div className="form-field full-width">
            <label>🔗 グループに共有</label>
            {eligibleGroups.length === 0 ? (
              <p className="no-groups-hint">
                「{formData.category}」を共有対象に設定しているグループがありません
              </p>
            ) : (
              <>
                <p className="share-hint">共有したくないグループはクリックして解除できます</p>
                <div className="group-select">
                  {eligibleGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      className={`group-btn ${selectedGroups.includes(group.id) ? 'selected' : ''}`}
                      onClick={() => handleGroupToggle(group.id)}
                    >
                      <span className="group-name">{group.name}</span>
                      {selectedGroups.includes(group.id) && <span className="check">✓</span>}
                    </button>
                  ))}
                </div>
                {selectedGroups.length > 0 ? (
                  <p className="share-info">
                    ✅ {selectedGroups.length}つのグループに自動共有されます
                  </p>
                ) : (
                  <p className="no-share-info">
                    グループには共有されません
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <button type="submit" className="button" disabled={isSubmitting || !formData.category}>
        {isSubmitting ? '記録中...' : '✅ 活動を記録'}
      </button>

      <style jsx>{`
        .activity-form {
          margin-bottom: 2rem;
        }
        .activity-form h3 {
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-field.full-width {
          grid-column: span 2;
        }
        .form-field label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }
        .loading-text {
          color: #64748b;
          font-size: 0.9rem;
        }
        .category-select {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .category-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .category-btn:hover {
          background: white;
        }
        .category-btn.selected {
          border-color: var(--cat-color, #6366f1);
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .customize-btn {
          padding: 0.5rem 1rem;
          background: rgba(99, 102, 241, 0.1);
          border: 2px dashed rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          font-size: 0.85rem;
          color: #6366f1;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .customize-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: #6366f1;
        }
        .slider {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(90deg, #e0e7ff 0%, #6366f1 100%);
          border-radius: 4px;
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #6366f1;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
        }
        .mood-select {
          display: flex;
          gap: 0.5rem;
        }
        .mood-btn {
          width: 44px;
          height: 44px;
          font-size: 1.5rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mood-btn:hover {
          transform: scale(1.1);
        }
        .mood-btn.selected {
          border-color: #6366f1;
          background: white;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
        }
        .group-select {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .group-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 10px;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .group-btn:hover {
          border-color: #6366f1;
          background: white;
        }
        .group-btn.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
        .group-btn .check {
          color: #10b981;
          font-weight: bold;
        }
        .share-hint {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0 0 0.5rem;
        }
        .share-info {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #10b981;
        }
        .no-share-info {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #94a3b8;
        }
        .no-groups-hint {
          font-size: 0.85rem;
          color: #64748b;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
          margin: 0;
        }
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .form-field.full-width {
            grid-column: span 1;
          }
        }
      `}</style>
    </form>
  );
}

