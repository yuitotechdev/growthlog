'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActivities } from '@/features/activity/hooks/useActivities';

export function GroupIntroPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const { activities } = useActivities({ excludeSamples: true });
  const router = useRouter();

  useEffect(() => {
    // 活動が2-3件登録されたら一度だけ表示
    const popupShown = sessionStorage.getItem('group_intro_shown');
    const activityCount = activities.filter(a => !a.isSample).length;
    
    if (!popupShown && activityCount >= 2 && activityCount <= 3) {
      setShowPopup(true);
      sessionStorage.setItem('group_intro_shown', 'true');
    }
  }, [activities]);

  if (!showPopup) return null;

  return (
    <div className="group-intro-overlay" onClick={() => setShowPopup(false)}>
      <div className="group-intro-popup" onClick={(e) => e.stopPropagation()}>
        <button
          className="group-intro-close"
          onClick={() => setShowPopup(false)}
          aria-label="閉じる"
        >
          ✕
        </button>
        
        <div className="group-intro-content">
          <div className="group-intro-icon">👥</div>
          <h2>仲間と一緒に成長すると続けやすいよ</h2>
          <p>グループではこんなことができます👇</p>
          
          <div className="group-intro-features">
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <span>活動の共有</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <span>AIによるグループ分析</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>ランキングでモチベUP</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>みんなの進捗が分かるチャット</span>
            </div>
          </div>

          <div className="group-intro-actions">
            <button
              className="button button-primary"
              onClick={() => {
                setShowPopup(false);
                router.push('/groups');
              }}
            >
              グループを作成する
            </button>
            <button
              className="button button-secondary"
              onClick={() => setShowPopup(false)}
            >
              後で
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .group-intro-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .group-intro-popup {
          background: white;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          padding: 2rem;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
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

        .group-intro-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #64748b;
          cursor: pointer;
          padding: 0.5rem;
          line-height: 1;
          transition: color 0.2s ease;
        }

        .group-intro-close:hover {
          color: #1e293b;
        }

        .group-intro-content {
          text-align: center;
        }

        .group-intro-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .group-intro-content h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        .group-intro-content > p {
          margin: 0 0 1.5rem 0;
          color: #64748b;
        }

        .group-intro-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(99, 102, 241, 0.05);
          border-radius: 8px;
          font-size: 0.9rem;
          color: #1e293b;
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .group-intro-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .button {
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .button-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .button-secondary {
          background: rgba(0, 0, 0, 0.05);
          color: #64748b;
        }

        .button-secondary:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 640px) {
          .group-intro-features {
            grid-template-columns: 1fr;
          }

          .group-intro-actions {
            flex-direction: column;
          }

          .button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

