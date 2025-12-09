'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ApiClient } from '@growthlog/shared';
import { Loading } from '@/components/ui/Loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) {
        setCheckComplete(true);
        setIsAdmin(false);
        return;
      }

      try {
        const client = new ApiClient({
          baseUrl: API_BASE_URL,
          getToken: () => token,
        });
        const profile = await client.get<{ isAdmin: boolean }>('/api/profile');
        setIsAdmin(profile.isAdmin === true);
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      } finally {
        setCheckComplete(true);
      }
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [token, authLoading]);

  if (authLoading || !checkComplete) {
    return <Loading />;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒 アクセス拒否</h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>管理者権限が必要です</p>
        <Link href="/" style={{ color: '#6366f1' }}>← ホームに戻る</Link>
      </div>
    );
  }

  const navItems = [
    { href: '/admin/users', icon: '👥', label: 'ユーザー管理' },
    { href: '/admin/analytics', icon: '📈', label: '統計・分析' },
    { href: '/admin/logs', icon: '📋', label: 'システムログ' },
    { href: '/admin/settings', icon: '⚙️', label: '設定' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>🛡️ 管理画面</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link href="/" className="back-link">
            ← アプリに戻る
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: calc(100vh - 70px);
        }

        .admin-sidebar {
          width: 260px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 70px;
          height: calc(100vh - 70px);
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .sidebar-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          text-decoration: none;
          color: #475569;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .nav-label {
          font-size: 0.95rem;
        }

        .sidebar-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .back-link {
          color: #64748b;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #6366f1;
        }

        .admin-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .admin-layout {
            flex-direction: column;
          }

          .admin-sidebar {
            width: 100%;
            position: static;
            height: auto;
          }

          .sidebar-nav {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
          }

          .nav-label {
            display: none;
          }

          .nav-item {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

