'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const borderColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1';

  return (
    <div className="toast" style={{ borderLeftColor: borderColor }}>
      <span className="toast-icon">{icon}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
      <style jsx>{`
        .toast {
          position: fixed;
          top: 100px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border-left: 4px solid;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slideIn 0.3s ease;
          max-width: 400px;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toast-icon {
          font-size: 1.1rem;
        }
        .toast-message {
          flex: 1;
          font-size: 0.9rem;
          color: #1e293b;
        }
        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 0.9rem;
        }
        .toast-close:hover {
          color: #64748b;
        }
      `}</style>
    </div>
  );
}


