'use client';

import { useState, useEffect } from 'react';

export function FabGuide() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // オンボーディング完了後に一度だけ表示
    const onboardingComplete = sessionStorage.getItem('onboarding_complete');
    const guideShown = sessionStorage.getItem('fab_guide_shown');
    
    if (onboardingComplete === 'true' && !guideShown) {
      setShowGuide(true);
      sessionStorage.setItem('fab_guide_shown', 'true');
    }
  }, []);

  if (!showGuide) return null;

  return (
    <div className="fab-guide">
      <div className="fab-guide-content">
        <div className="fab-guide-icon">➕</div>
        <div className="fab-guide-text">
          <h3>右下の「＋」ボタンから</h3>
          <p>いつでも活動を追加できます</p>
        </div>
        <button
          className="fab-guide-close"
          onClick={() => setShowGuide(false)}
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      <style jsx>{`
        .fab-guide {
          position: fixed;
          bottom: 120px;
          right: 2rem;
          z-index: 999;
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

        .fab-guide-content {
          background: white;
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 300px;
          position: relative;
        }

        .fab-guide-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .fab-guide-text h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          color: #1e293b;
        }

        .fab-guide-text p {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .fab-guide-close {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #64748b;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.2s ease;
        }

        .fab-guide-close:hover {
          color: #1e293b;
        }

        @media (max-width: 640px) {
          .fab-guide {
            bottom: 100px;
            right: 1.5rem;
            left: 1.5rem;
          }

          .fab-guide-content {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

