'use client';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export function StatCard({ icon, label, value, unit, color = '#6366f1' }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--accent-color': color } as React.CSSProperties}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">
          {value}
          {unit && <span className="stat-unit">{unit}</span>}
        </span>
      </div>
      <style jsx>{`
        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.12);
        }
        .stat-icon {
          font-size: 2rem;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--accent-color) 10%, transparent);
          border-radius: 12px;
        }
        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }
        .stat-unit {
          font-size: 0.9rem;
          font-weight: 500;
          color: #64748b;
          margin-left: 0.25rem;
        }
      `}</style>
    </div>
  );
}



