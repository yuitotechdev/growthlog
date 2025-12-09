'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ApiClient } from '@growthlog/shared';
import { Loading } from '@/components/ui/Loading';
import { Toast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  username: string | null;
  uniqueId: string | null;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count?: {
    activities: number;
    insights: number;
  };
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      const data = await client.get<{ users: User[]; total: number }>('/api/admin/users');
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleSuspend = async (userId: string, isSuspended: boolean) => {
    if (!token) return;

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      const endpoint = isSuspended ? 'activate' : 'suspend';
      await client.post(`/api/admin/users/${userId}/${endpoint}`, {});
      setToast({ message: `ユーザーを${isSuspended ? '有効化' : '停止'}しました`, type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || '操作に失敗しました', type: 'error' });
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    if (!token) return;

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      await client.post(`/api/admin/users/${userId}/toggle-admin`, {});
      setToast({ message: '管理者権限を変更しました', type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || '操作に失敗しました', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`本当に ${email} を削除しますか？この操作は取り消せません。`)) return;
    if (!token) return;

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      await client.delete(`/api/admin/users/${userId}`);
      setToast({ message: 'ユーザーを削除しました', type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || '削除に失敗しました', type: 'error' });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uniqueId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <Loading />;

  return (
    <div className="admin-users-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="page-header">
        <h1>👥 ユーザー管理</h1>
        <p className="subtitle">登録ユーザーの管理と権限設定</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{users.length}</span>
          <span className="stat-label">総ユーザー数</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{users.filter(u => u.isAdmin).length}</span>
          <span className="stat-label">管理者数</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{users.filter(u => u.isSuspended).length}</span>
          <span className="stat-label">停止中</span>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="🔍 メール、ユーザー名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ユーザー</th>
              <th>状態</th>
              <th>活動数</th>
              <th>登録日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.isSuspended ? 'suspended' : ''}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {(user.username || user.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user.username || user.email}</span>
                      <span className="user-email">{user.email}</span>
                      {user.uniqueId && <span className="user-id">@{user.uniqueId}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="badges">
                    {user.isAdmin && <span className="badge admin">管理者</span>}
                    {user.isSuspended && <span className="badge suspended">停止中</span>}
                    {!user.isAdmin && !user.isSuspended && <span className="badge active">有効</span>}
                  </div>
                </td>
                <td>
                  <span className="activity-count">{user._count?.activities || 0}</span>
                </td>
                <td>
                  <span className="date">{new Date(user.createdAt).toLocaleDateString('ja-JP')}</span>
                </td>
                <td>
                  <div className="actions">
                    <button
                      className={`action-btn ${user.isSuspended ? 'activate' : 'suspend'}`}
                      onClick={() => handleToggleSuspend(user.id, user.isSuspended)}
                      title={user.isSuspended ? '有効化' : '停止'}
                    >
                      {user.isSuspended ? '✓' : '⏸'}
                    </button>
                    <button
                      className={`action-btn ${user.isAdmin ? 'demote' : 'promote'}`}
                      onClick={() => handleToggleAdmin(user.id)}
                      title={user.isAdmin ? '管理者解除' : '管理者に昇格'}
                    >
                      {user.isAdmin ? '👤' : '🛡️'}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .admin-users-page {
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: #64748b;
          margin: 0;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          padding: 1.25rem;
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #6366f1;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.85rem;
        }

        .search-box {
          margin-bottom: 1.5rem;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 14px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.25s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
        }

        .users-table-wrapper {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(99, 102, 241, 0.1);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th {
          text-align: left;
          padding: 1rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          background: rgba(99, 102, 241, 0.05);
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .users-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(99, 102, 241, 0.05);
        }

        .users-table tr:last-child td {
          border-bottom: none;
        }

        .users-table tr.suspended {
          opacity: 0.6;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          color: #1e293b;
        }

        .user-email {
          font-size: 0.8rem;
          color: #64748b;
        }

        .user-id {
          font-size: 0.75rem;
          color: #6366f1;
        }

        .badges {
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .badge.admin {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }

        .badge.suspended {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .activity-count {
          font-weight: 600;
          color: #1e293b;
        }

        .date {
          font-size: 0.85rem;
          color: #64748b;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .action-btn.suspend {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .action-btn.activate {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .action-btn.promote {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .action-btn.demote {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
        }

        .action-btn.delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .users-table-wrapper {
            overflow-x: auto;
          }

          .users-table {
            min-width: 600px;
          }
        }
      `}</style>
    </div>
  );
}

