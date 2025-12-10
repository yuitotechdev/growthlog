'use client';

import { useState } from 'react';
import { ApiClient, LoginResponse } from '@growthlog/shared';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SignUpResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    uniqueId: string;
    emailVerified: boolean;
  };
}

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate uniqueId format
    if (uniqueId.length < 3 || uniqueId.length > 20) {
      setError('ユーザーIDは3文字以上20文字以下で入力してください');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(uniqueId)) {
      setError('ユーザーIDは英数字とアンダースコアのみ使用できます');
      setIsLoading(false);
      return;
    }

    try {
      const client = new ApiClient({ baseUrl: API_BASE_URL });
      const response = await client.post<SignUpResponse>('/api/auth/signup', {
        email,
        password,
        uniqueId,
        name: name || undefined,
      });

      // 登録成功時は自動的にログイン
      if (response.user) {
        // 登録成功後、自動的にログイン
        const loginClient = new ApiClient({ baseUrl: API_BASE_URL });
        try {
          const loginResponse = await loginClient.post<LoginResponse>('/api/auth/login', {
            identifier: uniqueId,
            password,
          });
          login(loginResponse.token);
          // 初回ユーザーはオンボーディングページにリダイレクト
          window.location.href = '/onboarding';
        } catch (err: any) {
          // ログインに失敗した場合は、通常のログインページにリダイレクト
          window.location.href = '/auth/login';
        }
      }
    } catch (err: any) {
      // 409エラー（既に登録されている）の場合、特別なメッセージを表示
      if (err.message && err.message.includes('既に登録されています')) {
        setError('このメールアドレスは既に登録されています。ログインページからログインしてください。');
      } else if (err.message && err.message.includes('既に使用されています')) {
        setError('このユーザーIDは既に使用されています。別のユーザーIDを入力してください。');
      } else {
        setError(err.message || '登録に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
          {error.includes('既に登録されています') && (
            <div style={{ marginTop: '0.5rem' }}>
              <a href="/auth/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                → ログインページへ
              </a>
            </div>
          )}
        </div>
      )}
      
      <div className="form-field">
        <label>メールアドレス <span className="required">*</span></label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="input"
          required
        />
      </div>

      <div className="form-field">
        <label>ユーザーID <span className="required">*</span></label>
        <input
          type="text"
          value={uniqueId}
          onChange={(e) => setUniqueId(e.target.value.toLowerCase())}
          placeholder="user123"
          className="input"
          pattern="[a-zA-Z0-9_]{3,20}"
          required
        />
        <p className="hint">3-20文字の英数字とアンダースコアのみ。重複不可</p>
      </div>

      <div className="form-field">
        <label>名前（任意）</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="山田 太郎"
          className="input"
        />
        <p className="hint">重複しても問題ありません</p>
      </div>

      <div className="form-field">
        <label>パスワード <span className="required">*</span></label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6文字以上"
          className="input"
          minLength={6}
          required
        />
      </div>

      <button type="submit" className="button" disabled={isLoading}>
        {isLoading ? '🔄 登録中...' : '✨ 新規登録'}
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
        .required {
          color: #ef4444;
        }
        .hint {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }
        .button {
          margin-top: 0.5rem;
        }
      `}</style>
    </form>
  );
}


