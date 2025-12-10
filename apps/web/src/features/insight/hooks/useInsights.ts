'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiClient, InsightDto } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useInsights(limit?: number) {
  const [insights, setInsights] = useState<InsightDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchInsights = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const url = limit ? `/api/insights?limit=${limit}` : '/api/insights';
      const data = await client.get<InsightDto[]>(url);
      setInsights(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'インサイトの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [token, limit]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const deleteInsight = useCallback(async (id: string) => {
    if (!token) return;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    await client.delete(`/api/insights/${id}`);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, [token]);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights,
    deleteInsight,
  };
}



