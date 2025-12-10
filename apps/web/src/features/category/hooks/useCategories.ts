'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchCategories = useCallback(async () => {
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

      const data = await client.get<Category[]>('/api/categories');
      setCategories(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'カテゴリの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (data: { name: string; emoji: string; color: string }) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const newCategory = await client.post<Category>('/api/categories', data);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  }, [token]);

  const updateCategory = useCallback(async (id: string, data: { name?: string; emoji?: string; color?: string }) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const updated = await client.put<Category>(`/api/categories/${id}`, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, [token]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!token) return;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    await client.delete(`/api/categories/${id}`);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, [token]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}




