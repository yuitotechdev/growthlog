'use client';

import { useState, useEffect, useCallback } from 'react';

const TOKEN_KEY = 'growthlog_token';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // クライアントサイドでのみトークンを取得
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      setToken(storedToken);
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string) => {
    try {
      if (!newToken || typeof newToken !== 'string') {
        throw new Error('無効なトークンです');
      }
      
      if (typeof window === 'undefined') {
        throw new Error('ブラウザ環境でのみ実行できます');
      }
      
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    } catch (error: any) {
      console.error('[useAuth] Error in login function:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    window.location.href = '/';
  }, []);

  return {
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };
}
