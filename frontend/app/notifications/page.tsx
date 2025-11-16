'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, FileText, Send, Mail, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const params = filter === 'unread' ? '?unread_only=true' : '';
        const response = await apiClient.get(`/api/notifications${params}`);
        setNotifications(response.data.notifications || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [filter]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const deleteAllRead = async () => {
    try {
      await apiClient.delete('/api/notifications/read/all');
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'task_failed': return <XCircle className="h-6 w-6 text-red-500" />;
      case 'pdf_generated': return <FileText className="h-6 w-6 text-blue-500" />;
      case 'email_sent': return <Send className="h-6 w-6 text-indigo-500" />;
      case 'new_email': return <Mail className="h-6 w-6 text-purple-500" />;
      case 'error': return <AlertCircle className="h-6 w-6 text-red-500" />;
      default: return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_completed': return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900';
      case 'task_failed': return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900';
      case 'pdf_generated': return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900';
      case 'email_sent': return 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900';
      case 'new_email': return 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900';
      case 'error': return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Powiadomienia
            </h1>
            {unreadCount > 0 && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {unreadCount} nieprzeczytanych
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Nieprzeczytane
              </button>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Oznacz wszystkie
              </Button>
            )}
            {notifications.some(n => n.read) && (
              <Button
                onClick={deleteAllRead}
                variant="ghost"
                size="sm"
                className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Usuń przeczytane
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Ładowanie powiadomień...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {filter === 'unread' ? 'Brak nieprzeczytanych powiadomień' : 'Brak powiadomień'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'unread' 
              ? 'Wszystkie powiadomienia zostały przeczytane'
              : 'Powiadomienia pojawią się tutaj gdy system wykona zadania'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-6 rounded-lg border-2 transition-all ${getNotificationColor(notification.type)} ${
                !notification.read ? 'shadow-md' : 'opacity-75'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="mt-1 flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className={`text-lg font-semibold ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.title}
                    </h3>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Usuń powiadomienie"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                    {notification.message}
                  </p>

                  {/* Metadata */}
                  {notification.metadata && (
                    <div className="bg-white/50 dark:bg-gray-900/30 rounded p-3 mb-3 text-sm">
                      <pre className="text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {JSON.stringify(notification.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(notification.created_at)}
                    </span>
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Oznacz jako przeczytane
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
