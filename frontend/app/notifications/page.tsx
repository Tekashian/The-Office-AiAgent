'use client';

import { useState, useCallback } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNotifications, type NotificationFilter } from '@/hooks/useNotifications';
import { NotificationList } from '@/components/notifications/NotificationList';
import { NotificationError } from '@/components/notifications/NotificationError';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  
  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refresh,
  } = useNotifications({ filter });

  // Debounced action handlers to prevent rapid clicks
  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      // Error already handled in hook with rollback
      console.error('Mark as read failed:', error);
    }
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Mark all as read failed:', error);
    }
  }, [markAllAsRead]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Delete notification failed:', error);
    }
  }, [deleteNotification]);

  const handleDeleteAllRead = useCallback(async () => {
    try {
      await deleteAllRead();
    } catch (error) {
      console.error('Delete all read failed:', error);
    }
  }, [deleteAllRead]);

  const hasReadNotifications = notifications.some(n => n.read);

  // Show error state if fetch failed
  if (error && !isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <NotificationError message={error} onRetry={refresh} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="h-8 w-8" aria-hidden="true" />
              Powiadomienia
            </h1>
            {unreadCount > 0 && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {unreadCount} {unreadCount === 1 ? 'nieprzeczytane' : 'nieprzeczytanych'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <nav
              className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
              role="tablist"
              aria-label="Filtr powiadomień"
            >
              <button
                onClick={() => setFilter('all')}
                role="tab"
                aria-selected={filter === 'all'}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  filter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setFilter('unread')}
                role="tab"
                aria-selected={filter === 'unread'}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  filter === 'unread'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Nieprzeczytane
              </button>
            </nav>

            {/* Actions */}
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="gap-2"
                aria-label="Oznacz wszystkie jako przeczytane"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Oznacz wszystkie
              </Button>
            )}
            {hasReadNotifications && (
              <Button
                onClick={handleDeleteAllRead}
                variant="ghost"
                size="sm"
                className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
                aria-label="Usuń wszystkie przeczytane powiadomienia"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Usuń przeczytane
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Notifications List */}
      <NotificationList
        notifications={notifications}
        isLoading={isLoading}
        filter={filter}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    </div>
  );
}
