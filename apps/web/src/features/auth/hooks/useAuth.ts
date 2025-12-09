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
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
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


