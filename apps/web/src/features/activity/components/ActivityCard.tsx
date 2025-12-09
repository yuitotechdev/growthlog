'use client';

import { useState } from 'react';
import { ActivityDto, ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCategories, Category } from '@/features/category/hooks/useCategories';
import { MoodDisplay } from '@/components/ui/MoodDisplay';
import { ShareActivityModal } from './ShareActivityModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ActivityCardProps {
  activity: ActivityDto;
  onDelete?: (id: string) => void;
  onUpdate?: (activity: ActivityDto) => void;
}

const DEFAULT_CATEGORY_MAP: Record<string, { emoji: string; color: string }> = {
  '勉強': { emoji: '📚', color: '#3b82f6' },
  '仕事': { emoji: '💼', color: '#8b5cf6' },
  '運動': { emoji: '🏃', color: '#10b981' },
  '生活': { emoji: '🏠', color: '#f59e0b' },
  'その他': { emoji: '📦', color: '#64748b' },
};

export function ActivityCard({ activity, onDelete, onUpdate }: ActivityCardProps) {
  const { token } = useAuth();
  const { categories = [] } = useCategories();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const getCategoryInfo = (categoryName: string): { emoji: string; color: string } => {
    const found = categories.find((c) => c.name === categoryName);
    if (found) {
      return { emoji: found.emoji, color: found.color };
    }
    return DEFAULT_CATEGORY_MAP[categoryName] || { emoji: '📦', color: '#64748b' };
  };

  const categoryInfo = getCategoryInfo(activity.category);

  const handleDelete = async () => {
    if (!token || !onDelete) return;

    setIsDeleting(true);
    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      await client.delete(`/api/activities/${activity.id}`);
      onDelete(activity.id);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  return (
    <div className="activity-card" style={{ '--accent-color': categoryInfo.color } as React.CSSProperties}>
      <div className="card-header">
        <span className="category-icon">{categoryInfo.emoji}</span>
        <div className="title-section">
          <h3>{activity.title}</h3>
          <span className="category-badge">{activity.category}</span>
        </div>
        <MoodDisplay mood={activity.mood} />
      </div>

      <div className="card-body">
        <div className="meta-info">
          <span className="meta-item">
            <span className="meta-icon">📅</span>
            {formatDate(activity.date)}
          </span>
          <span className="meta-item">
            <span className="meta-icon">⏱️</span>
            {activity.durationMinutes}分
          </span>
        </div>
        {activity.note && <p className="note">{activity.note}</p>}
      </div>

      <div className="card-actions">
        <button 
          className={`btn-share ${shareSuccess ? 'success' : ''}`} 
          onClick={() => setShowShareModal(true)}
          title="グループに共有"
        >
          {shareSuccess ? '✓ 共有済み' : '🔗 共有'}
        </button>
        {showDeleteConfirm ? (
          <>
            <span className="confirm-text">削除しますか？</span>
            <button className="btn-confirm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '削除中...' : '削除'}
            </button>
            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
              キャンセル
            </button>
          </>
        ) : (
          <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
            🗑️
          </button>
        )}
      </div>

      {showShareModal && (
        <ShareActivityModal
          activity={activity}
          onClose={() => setShowShareModal(false)}
          onSuccess={() => {
            setShowShareModal(false);
            setShareSuccess(true);
          }}
        />
      )}

      <style jsx>{`
        .activity-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-left: 4px solid var(--accent-color);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }
        .activity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.12);
        }
        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .category-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--accent-color) 15%, white);
          border-radius: 12px;
          font-size: 1.5rem;
        }
        .title-section {
          flex: 1;
        }
        .title-section h3 {
          margin: 0 0 0.25rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .category-badge {
          font-size: 0.75rem;
          padding: 0.2rem 0.6rem;
          background: color-mix(in srgb, var(--accent-color) 15%, white);
          color: var(--accent-color);
          border-radius: 6px;
          font-weight: 500;
        }
        .meta-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: #64748b;
        }
        .note {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.5;
          margin: 0;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
        }
        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }
        .confirm-text {
          font-size: 0.85rem;
          color: #ef4444;
          margin-right: auto;
        }
        .btn-share, .btn-delete, .btn-confirm, .btn-cancel {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .btn-share {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          margin-right: auto;
        }
        .btn-share:hover {
          background: rgba(99, 102, 241, 0.2);
        }
        .btn-share.success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        .btn-delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        .btn-confirm {
          background: #ef4444;
          color: white;
        }
        .btn-cancel {
          background: rgba(0, 0, 0, 0.05);
          color: #64748b;
        }
      `}</style>
    </div>
  );
}

