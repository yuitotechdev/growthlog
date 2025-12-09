'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface GroupMember {
  id: string;
  user: {
    id: string;
    username: string | null;
    uniqueId: string | null;
    avatarEmoji: string | null;
  };
  role: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  owner: {
    id: string;
    username: string | null;
    uniqueId: string | null;
    avatarEmoji: string | null;
  };
  members: GroupMember[];
  sharedCategories: string[];
  memberCount: number;
  activityCount: number;
  createdAt: string;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchGroups = useCallback(async () => {
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

      const data = await client.get<Group[]>('/api/groups');
      // Filter out any null values
      setGroups(data?.filter((g) => g && g.id) || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'グループの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(async (data: {
    name: string;
    description?: string;
    sharedCategories: string[];
  }) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const newGroup = await client.post<Group>('/api/groups', data);
    setGroups((prev) => [newGroup, ...prev]);
    return newGroup;
  }, [token]);

  const joinGroup = useCallback(async (inviteCode: string) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const group = await client.post<Group>(`/api/groups/join/${inviteCode}`, {});
    setGroups((prev) => [group, ...prev]);
    return group;
  }, [token]);

  const leaveGroup = useCallback(async (groupId: string) => {
    if (!token) return;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    await client.post(`/api/groups/${groupId}/leave`, {});
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, [token]);

  const deleteGroup = useCallback(async (groupId: string) => {
    if (!token) return;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    await client.delete(`/api/groups/${groupId}`);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, [token]);

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
  };
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchGroup = useCallback(async () => {
    if (!token || !groupId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });

      const data = await client.get<Group>(`/api/groups/${groupId}`);
      setGroup(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'グループの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [token, groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const updateGroup = useCallback(async (data: { name?: string; description?: string }) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const updated = await client.put<Group>(`/api/groups/${groupId}`, data);
    setGroup(updated);
    return updated;
  }, [token, groupId]);

  const updateCategories = useCallback(async (categories: string[]) => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const updated = await client.put<Group>(`/api/groups/${groupId}/categories`, { categories });
    setGroup(updated);
    return updated;
  }, [token, groupId]);

  const inviteMember = useCallback(async (uniqueId: string) => {
    if (!token) return;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    await client.post(`/api/groups/${groupId}/invite`, { uniqueId });
    await fetchGroup();
  }, [token, groupId, fetchGroup]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!token) return;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    await client.delete(`/api/groups/${groupId}/members/${memberId}`);
    await fetchGroup();
  }, [token, groupId, fetchGroup]);

  const regenerateInviteCode = useCallback(async () => {
    if (!token) return null;

    const client = new ApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => token,
    });

    const result = await client.post<{ inviteCode: string }>(`/api/groups/${groupId}/regenerate-invite`, {});
    if (group) {
      setGroup({ ...group, inviteCode: result.inviteCode });
    }
    return result.inviteCode;
  }, [token, groupId, group]);

  return {
    group,
    isLoading,
    error,
    refetch: fetchGroup,
    updateGroup,
    updateCategories,
    inviteMember,
    removeMember,
    regenerateInviteCode,
  };
}

