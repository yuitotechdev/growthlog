'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  uniqueId: string | null;
  avatarEmoji: string | null;
  canChangeUniqueId: boolean;
  createdAt: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchProfile = useCallback(async () => {
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

      const data = await client.get<Profile>('/api/profile');
      setProfile(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'プロフィールの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: { username?: string; avatarEmoji?: string | null }) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const updated = await client.put<Profile>('/api/profile', data);
    setProfile(updated);
    return updated;
  }, [token]);

  const updateUniqueId = useCallback(async (uniqueId: string) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const updated = await client.put<Profile>('/api/profile/unique-id', { uniqueId });
    setProfile(updated);
    return updated;
  }, [token]);

  const checkUniqueIdAvailability = useCallback(async (uniqueId: string) => {
    if (!token) return { available: false, message: '' };

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    return client.get<{ available: boolean; message: string }>(`/api/profile/check-unique-id/${uniqueId}`);
  }, [token]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
    updateUniqueId,
    checkUniqueIdAvailability,
  };
}


