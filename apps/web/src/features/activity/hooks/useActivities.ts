'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiClient, ActivityDto } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useActivities() {
  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchActivities = useCallback(async () => {
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

      const data = await client.get<ActivityDto[]>('/api/activities');
      setActivities(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || '活動の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = useCallback((activity: ActivityDto) => {
    setActivities((prev) => [activity, ...prev]);
  }, []);

  const removeActivity = useCallback(async (id: string) => {
    if (!token) return;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    await client.delete(`/api/activities/${id}`);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, [token]);

  const updateActivity = useCallback((activity: ActivityDto) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? activity : a))
    );
  }, []);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
    addActivity,
    removeActivity,
    updateActivity,
  };
}


