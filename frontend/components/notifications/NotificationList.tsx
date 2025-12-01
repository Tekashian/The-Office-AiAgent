import { Bell } from 'lucide-react';
import { NotificationCard } from './NotificationCard';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  filter: 'all' | 'unread';
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationList({
  notifications,
  isLoading,
  filter,
  onMarkAsRead,
  onDelete,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12" role="status" aria-label="Ładowanie">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-gray-500 dark:text-gray-400 mt-4">
          Ładowanie powiadomień...
        </p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <Bell className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {filter === 'unread'
            ? 'Brak nieprzeczytanych powiadomień'
            : 'Brak powiadomień'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {filter === 'unread'
            ? 'Wszystkie powiadomienia zostały przeczytane'
            : 'Powiadomienia pojawią się tutaj gdy system wykona zadania'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
