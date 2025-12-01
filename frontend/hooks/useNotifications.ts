import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType = 
  | 'task_completed' 
  | 'task_failed' 
  | 'pdf_generated' 
  | 'email_sent' 
  | 'new_email' 
  | 'error'
  | 'info';

export type NotificationFilter = 'all' | 'unread';

interface UseNotificationsOptions {
  filter?: NotificationFilter;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { filter = 'all', autoRefresh = false, refreshInterval = 30000 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const response = await apiClient.get(`/api/notifications${params}`);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Fetch notifications error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    const previousNotifications = [...notifications];
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
    } catch (err) {
      // Rollback on error
      setNotifications(previousNotifications);
      const errorMessage = 'Failed to mark notification as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await apiClient.post('/api/notifications/mark-all-read');
    } catch (err) {
      setNotifications(previousNotifications);
      const errorMessage = 'Failed to mark all as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await apiClient.delete(`/api/notifications/${id}`);
    } catch (err) {
      setNotifications(previousNotifications);
      const errorMessage = 'Failed to delete notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [notifications]);

  const deleteAllRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => !n.read));

    try {
      await apiClient.delete('/api/notifications/read/all');
    } catch (err) {
      setNotifications(previousNotifications);
      const errorMessage = 'Failed to delete read notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refresh: fetchNotifications,
  };
}
