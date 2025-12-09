'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ActivityForm } from '@/features/activity/components/ActivityForm';
import { ActivityList } from '@/features/activity/components/ActivityList';
import { useActivities } from '@/features/activity/hooks/useActivities';

export default function ActivitiesPage() {
  const searchParams = useSearchParams();
  const autoOpen = searchParams.get('new') === 'true';
  const [showForm, setShowForm] = useState(autoOpen);
  const { activities, isLoading, error, addActivity, removeActivity, updateActivity } = useActivities();

  useEffect(() => {
    if (autoOpen) setShowForm(true);
  }, [autoOpen]);

  return (
    <div className="activities-page">
      <div className="page-header">
        <div className="header-content">
          <h1>📝 活動ログ</h1>
          <p>日々の活動を記録して、成長を可視化しましょう</p>
        </div>
        <button
          className={`toggle-btn ${showForm ? 'active' : ''}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ フォームを閉じる' : '➕ 新しい活動を追加'}
        </button>
      </div>

      {showForm && (
        <ActivityForm
          onSuccess={(activity) => {
            if (activity) addActivity(activity);
            setShowForm(false);
          }}
        />
      )}

      <ActivityList
        activities={activities}
        isLoading={isLoading}
        error={error}
        onDelete={removeActivity}
        onUpdate={updateActivity}
      />

      <style jsx>{`
        .activities-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header-content h1 {
          font-size: 2rem;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header-content p {
          color: #64748b;
          font-size: 0.9rem;
        }
        .toggle-btn {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }
        .toggle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }
        .toggle-btn.active {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }
        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
          }
          .toggle-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}


