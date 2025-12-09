'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';

export function NavBar() {
  const pathname = usePathname();
  const { token, logout } = useAuth();
  const { profile } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/admin/stats/overview', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAdmin(response.ok);
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [token]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 管理画面内では非表示
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // イニシャルを取得
  const getInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  return (
    <>
      <nav className="gl-navbar">
        <div className="gl-nav-container">
          <Link href="/" className="gl-nav-brand">
            <span className="gl-brand-icon">📈</span>
            <span className="gl-brand-text">GrowthLog</span>
          </Link>
          <div className="gl-nav-links">
            <Link href="/activities" className={`gl-nav-link ${pathname === '/activities' ? 'active' : ''}`}>
              <span className="gl-nav-icon">📝</span>
              <span className="gl-nav-label">活動ログ</span>
            </Link>
            <Link href="/insights" className={`gl-nav-link ${pathname === '/insights' ? 'active' : ''}`}>
              <span className="gl-nav-icon">💡</span>
              <span className="gl-nav-label">インサイト</span>
            </Link>
            {token && (
              <Link href="/groups" className={`gl-nav-link ${pathname?.startsWith('/groups') ? 'active' : ''}`}>
                <span className="gl-nav-icon">👥</span>
                <span className="gl-nav-label">グループ</span>
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="gl-nav-link gl-admin-link">
                <span className="gl-nav-icon">🛡️</span>
                <span className="gl-nav-label">管理</span>
              </Link>
            )}
            
            {/* ユーザーメニュー */}
            {token && (
              <div className="gl-user-menu" ref={menuRef}>
                <button 
                  className="gl-avatar-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {profile?.avatarEmoji ? (
                    <span className="gl-avatar-emoji">{profile.avatarEmoji}</span>
                  ) : (
                    <span className="gl-avatar-initials">{getInitials()}</span>
                  )}
                </button>
                
                {showUserMenu && (
                  <div className="gl-dropdown">
                    <div className="gl-dropdown-header">
                      <span className="gl-dropdown-name">{profile?.username || 'ユーザー'}</span>
                      {profile?.uniqueId && (
                        <span className="gl-dropdown-id">@{profile.uniqueId}</span>
                      )}
                    </div>
                    <div className="gl-dropdown-divider" />
                    <Link href="/settings/profile" className="gl-dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <span>👤</span>
                      プロフィール設定
                    </Link>
                    <Link href="/settings/categories" className="gl-dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <span>🏷️</span>
                      カテゴリ設定
                    </Link>
                    <div className="gl-dropdown-divider" />
                    <button className="gl-dropdown-item gl-logout-item" onClick={() => { logout(); setShowUserMenu(false); }}>
                      <span>👋</span>
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <style jsx global>{`
        .gl-navbar {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.6);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 30px rgba(99, 102, 241, 0.08);
        }

        .gl-nav-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .gl-nav-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0.5rem;
          border-radius: 12px;
        }

        .gl-nav-brand:hover {
          transform: scale(1.05);
          background: rgba(99, 102, 241, 0.08);
        }

        .gl-brand-icon {
          font-size: 1.6rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
        }

        .gl-brand-text {
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gl-nav-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .gl-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          text-decoration: none;
          padding: 0.7rem 1.1rem;
          border-radius: 14px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gl-nav-link:hover {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          transform: translateY(-2px);
        }

        .gl-nav-link.active {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.12);
        }

        .gl-nav-icon {
          font-size: 1.1rem;
        }

        .gl-admin-link {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white !important;
        }

        .gl-admin-link:hover {
          background: linear-gradient(135deg, #334155 0%, #475569 100%);
        }

        /* ユーザーメニュー */
        .gl-user-menu {
          position: relative;
          margin-left: 0.5rem;
        }

        .gl-avatar-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(99, 102, 241, 0.2);
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gl-avatar-btn:hover {
          border-color: #6366f1;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .gl-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gl-avatar-initials {
          color: white;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .gl-avatar-emoji {
          font-size: 1.5rem;
          line-height: 1;
        }

        .gl-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: dropdownIn 0.2s ease;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .gl-dropdown-header {
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .gl-dropdown-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
        }

        .gl-dropdown-id {
          font-size: 0.8rem;
          color: #64748b;
        }

        .gl-dropdown-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
          margin: 0;
        }

        .gl-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          color: #475569;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          background: none;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
        }

        .gl-dropdown-item:hover {
          background: rgba(99, 102, 241, 0.08);
          color: #6366f1;
        }

        .gl-logout-item:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
        }

        @media (max-width: 640px) {
          .gl-nav-container {
            padding: 0 1rem;
            height: 60px;
          }

          .gl-nav-link {
            padding: 0.6rem 0.8rem;
          }

          .gl-nav-label {
            display: none;
          }

          .gl-nav-icon {
            font-size: 1.3rem;
          }

          .gl-brand-text {
            font-size: 1.1rem;
          }

          .gl-dropdown {
            right: -1rem;
          }
        }
      `}</style>
    </>
  );
}


