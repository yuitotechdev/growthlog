'use client';

import { useState, useEffect } from 'react';
import { ApiClient, ActivityDto } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Group {
  id: string;
  name: string;
  sharedCategories: string[];
}

interface ShareActivityModalProps {
  activity: ActivityDto;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareActivityModal({ activity, onClose, onSuccess }: ShareActivityModalProps) {
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      if (!token) return;

      try {
        const client = new ApiClient({
          baseUrl: API_BASE_URL,
          getToken: () => token,
        });
        const data = await client.get<Group[]>('/api/groups');
        console.log('All groups:', data);
        console.log('Activity category:', activity.category);
        // この活動のカテゴリが共有対象のグループのみフィルタ
        const eligibleGroups = (data || []).filter((g) => {
          if (!g.sharedCategories) return false;
          const match = g.sharedCategories.some((cat) => cat === activity.category);
          console.log(`Group ${g.name}: categories=${g.sharedCategories.join(',')}, match=${match}`);
          return match;
        });
        console.log('Eligible groups:', eligibleGroups);
        setGroups(eligibleGroups);
      } catch (err) {
        console.error('Error fetching groups:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [token, activity.category]);

  const handleShare = async () => {
    if (!token || !selectedGroupId) return;

    setIsSharing(true);
    setError('');

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      await client.post('/api/shared-activities', {
        activityId: activity.id,
        groupId: selectedGroupId,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || '共有に失敗しました');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔗 グループに共有</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="activity-preview">
            <h4>{activity.title}</h4>
            <p>{activity.category} • {activity.durationMinutes}分 • {activity.date}</p>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          {isLoading ? (
            <p className="loading">読み込み中...</p>
          ) : groups.length === 0 ? (
            <div className="no-groups">
              <p>この活動を共有できるグループがありません</p>
              <p className="hint">グループの共有カテゴリに「{activity.category}」を含める必要があります</p>
            </div>
          ) : (
            <div className="group-select">
              <label>共有先グループを選択</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="input"
              >
                <option value="">選択してください</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>キャンセル</button>
          <button
            className="share-btn"
            onClick={handleShare}
            disabled={isSharing || !selectedGroupId || isLoading}
          >
            {isSharing ? '共有中...' : '共有する'}
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 450px;
            overflow: hidden;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .modal-header h3 {
            margin: 0;
            font-size: 1.1rem;
          }

          .close-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.05);
            cursor: pointer;
            font-size: 1rem;
          }

          .modal-body {
            padding: 1.5rem;
          }

          .activity-preview {
            background: rgba(99, 102, 241, 0.05);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .activity-preview h4 {
            margin: 0 0 0.25rem;
            font-size: 1rem;
          }

          .activity-preview p {
            margin: 0;
            font-size: 0.85rem;
            color: #64748b;
          }

          .error-message {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
          }

          .loading {
            text-align: center;
            color: #64748b;
          }

          .no-groups {
            text-align: center;
            padding: 1rem;
          }

          .no-groups p {
            margin: 0;
            color: #64748b;
          }

          .hint {
            font-size: 0.8rem;
            margin-top: 0.5rem !important;
            color: #94a3b8 !important;
          }

          .group-select {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .group-select label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #475569;
          }

          .input {
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid rgba(99, 102, 241, 0.2);
            border-radius: 12px;
            font-size: 0.95rem;
            font-family: inherit;
          }

          .input:focus {
            outline: none;
            border-color: #6366f1;
          }

          .modal-actions {
            display: flex;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            border-top: 1px solid #e5e7eb;
            justify-content: flex-end;
          }

          .cancel-btn, .share-btn {
            padding: 0.75rem 1.25rem;
            border: none;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
          }

          .cancel-btn {
            background: rgba(0, 0, 0, 0.05);
            color: #64748b;
          }

          .share-btn {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
          }

          .share-btn:disabled {
            background: #94a3b8;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}

