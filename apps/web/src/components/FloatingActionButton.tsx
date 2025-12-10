'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ActivityForm } from '@/features/activity/components/ActivityForm';
import { ActivityDto } from '@growthlog/shared';

export function FloatingActionButton() {
  const pathname = usePathname();
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    setShowForm(true);
  };

  const handleSuccess = (activity: ActivityDto | null) => {
    setShowForm(false);
    if (activity) {
      // 活動一覧ページにリダイレクト
      router.push('/activities');
    }
  };

  return (
    <>
      <button
        className="fab"
        onClick={handleClick}
        aria-label="新しい活動を追加"
      >
        <span className="fab-icon">➕</span>
      </button>

      {showForm && (
        <div className="fab-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="fab-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fab-modal-header">
              <h2>新しい活動を追加</h2>
              <button
                className="fab-modal-close"
                onClick={() => setShowForm(false)}
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <ActivityForm onSuccess={handleSuccess} />
          </div>
        </div>
      )}

      <style jsx>{`
        .fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: all 0.3s ease;
        }
        .fab:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5);
        }
        .fab:active {
          transform: scale(0.95);
        }
        .fab-icon {
          font-size: 1.5rem;
          color: white;
        }
        .fab-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .fab-modal-content {
          background: white;
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
        }
        .fab-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        .fab-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #1e293b;
        }
        .fab-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          line-height: 1;
          transition: color 0.2s ease;
        }
        .fab-modal-close:hover {
          color: #1e293b;
        }
        @media (max-width: 640px) {
          .fab {
            bottom: 1.5rem;
            right: 1.5rem;
            width: 56px;
            height: 56px;
          }
          .fab-icon {
            font-size: 1.25rem;
          }
          .fab-modal-content {
            max-height: 95vh;
            border-radius: 16px 16px 0 0;
            margin-top: auto;
          }
        }
      `}</style>
    </>
  );
}

