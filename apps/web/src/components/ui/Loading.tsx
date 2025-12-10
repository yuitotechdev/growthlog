'use client';

export function Loading() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>読み込み中...</p>
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        p {
          color: #64748b;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}




