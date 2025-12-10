'use client';

import { useState, useEffect } from 'react';
import { ApiClient, LoginResponse } from '@growthlog/shared';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // API URLの検証
  useEffect(() => {
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
      console.warn('[LoginForm] NEXT_PUBLIC_API_URL is not set, using default:', API_BASE_URL);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // API URLの検証
      if (!API_BASE_URL || API_BASE_URL === 'http://localhost:3001') {
        console.warn('[LoginForm] API URL might not be configured correctly:', API_BASE_URL);
      }

      const client = new ApiClient({ baseUrl: API_BASE_URL });
      const response = await client.post<LoginResponse>('/api/auth/login', {
        identifier,
        password,
      });

      if (!response || !response.token) {
        throw new Error('ログイン応答が無効です');
      }

      try {
        login(response.token);
        window.location.href = '/';
      } catch (loginError: any) {
        console.error('[LoginForm] Error in login function:', loginError);
        throw new Error('認証情報の保存に失敗しました: ' + (loginError.message || '不明なエラー'));
      }
    } catch (err: any) {
      console.error('[LoginForm] Login error:', err);
      let errorMessage = 'ログインに失敗しました';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        errorMessage = 'APIサーバーに接続できませんでした。ネットワーク接続を確認してください。';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      
      <div className="form-field">
        <label>ユーザーID</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="user123 または email@example.com"
          className="input"
          required
        />
        <p className="hint">ユーザーIDまたはメールアドレスでログインできます</p>
      </div>

      <div className="form-field">
        <label>パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          className="input"
          required
        />
      </div>

      <button type="submit" className="button" disabled={isLoading}>
        {isLoading ? '🔄 ログイン中...' : '🔐 ログイン'}
      </button>

      <style jsx>{`
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-field label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }
        .button {
          margin-top: 0.5rem;
        }
      `}</style>
    </form>
  );
}


