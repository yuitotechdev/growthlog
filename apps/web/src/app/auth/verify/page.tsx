'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      handleVerify(tokenParam);
    } else {
      setStatus('error');
      setMessage('認証トークンが指定されていません');
    }
  }, [searchParams]);

  const handleVerify = async (verifyToken: string) => {
    try {
      const client = new ApiClient({ baseUrl: API_BASE_URL });
      const response = await client.post<{ user: any; token: string }>('/api/auth/verify-email', {
        token: verifyToken,
      });

      // ログイン状態を更新
      login(response.token);

      setStatus('success');
      setMessage('メールアドレスの認証が完了しました！');

      // 3秒後にホームページにリダイレクト
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || '認証に失敗しました');
    }
  };

  const handleResend = async () => {
    // メールアドレスが必要なので、ここではトークンから取得できない
    // 実際の実装では、メールアドレスを入力してもらうか、セッションから取得
    setMessage('再送信機能は実装中です');
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        {status === 'loading' && (
          <>
            <div className="loading-icon">⏳</div>
            <h2>認証中...</h2>
            <p>メールアドレスを認証しています</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2>認証完了</h2>
            <p>{message}</p>
            <p className="redirect-message">ホームページにリダイレクトします...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">❌</div>
            <h2>認証失敗</h2>
            <p>{message}</p>
            <div className="actions">
              <button onClick={handleResend} className="resend-btn">
                認証メールを再送信
              </button>
              <button onClick={() => router.push('/')} className="home-btn">
                ホームに戻る
              </button>
            </div>
          </>
        )}

        <style jsx>{`
          .verify-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .verify-container {
            max-width: 500px;
            width: 100%;
            text-align: center;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 24px;
            padding: 3rem 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }

          .loading-icon,
          .success-icon,
          .error-icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
          }

          .verify-container h2 {
            margin: 0 0 1rem;
            font-size: 1.5rem;
            color: #1e293b;
          }

          .verify-container p {
            color: #64748b;
            margin: 0.5rem 0;
          }

          .redirect-message {
            font-size: 0.9rem;
            color: #94a3b8;
          }

          .actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 2rem;
          }

          .resend-btn,
          .home-btn {
            padding: 0.875rem 1.5rem;
            border: none;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s ease;
          }

          .resend-btn {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
          }

          .resend-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }

          .home-btn {
            background: rgba(0, 0, 0, 0.05);
            color: #1e293b;
          }

          .home-btn:hover {
            background: rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}

