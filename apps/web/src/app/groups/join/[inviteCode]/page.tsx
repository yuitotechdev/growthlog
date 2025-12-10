'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loading } from '@/components/ui/Loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface GroupPreview {
  id: string;
  name: string;
  description: string | null;
  owner: {
    username: string | null;
    uniqueId: string | null;
  };
  memberCount: number;
}

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.inviteCode as string;
  const { token, isLoading: authLoading } = useAuth();
  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchGroupPreview = async () => {
      if (authLoading) return;
      
      if (!token) {
        // ログインしていない場合はログインページにリダイレクト
        router.push(`/?redirect=/groups/join/${inviteCode}`);
        return;
      }

      try {
        const client = new ApiClient({
          baseUrl: API_BASE_URL,
          getToken: () => token,
        });

        const data = await client.get<GroupPreview>(`/api/groups/invite/${inviteCode}`);
        setGroupPreview(data);
      } catch (err: any) {
        setError(err.message || '招待コードが無効です');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupPreview();
  }, [inviteCode, token, authLoading, router]);

  const handleJoin = async () => {
    if (!token) return;

    setIsJoining(true);
    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const group = await client.post<{ id: string }>(`/api/groups/join/${inviteCode}`, {});
      router.push(`/groups/${group.id}`);
    } catch (err: any) {
      setError(err.message || '参加に失敗しました');
      setIsJoining(false);
    }
  };

  if (authLoading || isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="join-page">
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <h1>エラー</h1>
          <p>{error}</p>
          <button className="back-btn" onClick={() => router.push('/groups')}>
            ← グループ一覧に戻る
          </button>
        </div>
        <style jsx>{`
          .join-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 200px);
            padding: 2rem;
          }
          .error-card {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          .error-icon {
            font-size: 3rem;
            display: block;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #ef4444;
          }
          p {
            color: #64748b;
            margin-bottom: 1.5rem;
          }
          .back-btn {
            padding: 0.75rem 1.5rem;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
          }
        `}</style>
      </div>
    );
  }

  if (!groupPreview) {
    return <Loading />;
  }

  return (
    <div className="join-page">
      <div className="invite-card">
        <span className="invite-icon">👥</span>
        <h1>グループに招待されました</h1>
        
        <div className="group-info">
          <h2>{groupPreview.name}</h2>
          {groupPreview.description && (
            <p className="description">{groupPreview.description}</p>
          )}
          <div className="stats">
            <span>👤 オーナー: {groupPreview.owner.username || groupPreview.owner.uniqueId || '不明'}</span>
            <span>👥 {groupPreview.memberCount}人のメンバー</span>
          </div>
        </div>

        <button 
          className="join-btn" 
          onClick={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? '参加中...' : 'グループに参加する'}
        </button>

        <button className="cancel-btn" onClick={() => router.push('/groups')}>
          キャンセル
        </button>
      </div>

      <style jsx>{`
        .join-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 200px);
          padding: 2rem;
        }

        .invite-card {
          text-align: center;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
          max-width: 450px;
          width: 100%;
        }

        .invite-icon {
          font-size: 4rem;
          display: block;
          margin-bottom: 1.5rem;
          animation: bounce 2s ease infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #1e293b;
        }

        .group-info {
          background: rgba(99, 102, 241, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .group-info h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #6366f1;
          margin: 0 0 0.5rem;
        }

        .description {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0 0 1rem;
        }

        .stats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748b;
        }

        .join-btn {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          margin-bottom: 1rem;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
        }

        .join-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .join-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .cancel-btn {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.9rem;
          cursor: pointer;
          font-family: inherit;
        }

        .cancel-btn:hover {
          color: #1e293b;
        }
      `}</style>
    </div>
  );
}



