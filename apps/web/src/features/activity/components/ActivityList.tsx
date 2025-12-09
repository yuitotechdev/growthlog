'use client';

import { ActivityDto } from '@growthlog/shared';
import { ActivityCard } from './ActivityCard';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';

interface ActivityListProps {
  activities: ActivityDto[];
  isLoading: boolean;
  error: string | null;
  onDelete?: (id: string) => void;
  onUpdate?: (activity: ActivityDto) => void;
}

export function ActivityList({ activities, isLoading, error, onDelete, onUpdate }: ActivityListProps) {
  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div className="alert alert-error">⚠️ {error}</div>;
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="まだ活動がありません"
        description="最初の活動を記録してみましょう！"
      />
    );
  }

  return (
    <div className="activity-list">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
      <style jsx>{`
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}


