import { memo } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, FileText, Send, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Notification, NotificationType } from '@/hooks/useNotifications';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: typeof Bell;
  iconClassName: string;
  cardClassName: string;
}> = {
  task_completed: {
    icon: CheckCircle,
    iconClassName: 'h-6 w-6 text-green-500',
    cardClassName: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
  },
  task_failed: {
    icon: XCircle,
    iconClassName: 'h-6 w-6 text-red-500',
    cardClassName: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
  },
  pdf_generated: {
    icon: FileText,
    iconClassName: 'h-6 w-6 text-blue-500',
    cardClassName: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
  },
  email_sent: {
    icon: Send,
    iconClassName: 'h-6 w-6 text-indigo-500',
    cardClassName: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900',
  },
  new_email: {
    icon: Mail,
    iconClassName: 'h-6 w-6 text-purple-500',
    cardClassName: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900',
  },
  error: {
    icon: AlertCircle,
    iconClassName: 'h-6 w-6 text-red-500',
    cardClassName: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
  },
  info: {
    icon: Bell,
    iconClassName: 'h-6 w-6 text-gray-500',
    cardClassName: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const NotificationCard = memo<NotificationCardProps>(
  ({ notification, onMarkAsRead, onDelete }) => {
    const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.info;
    const Icon = config.icon;

    const handleMarkAsRead = () => {
      onMarkAsRead(notification.id);
    };

    const handleDelete = () => {
      onDelete(notification.id);
    };

    return (
      <div
        className={`p-6 rounded-lg border-2 transition-all ${config.cardClassName} ${
          !notification.read ? 'shadow-md' : 'opacity-75'
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="mt-1 flex-shrink-0">
            <Icon className={config.iconClassName} aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3
                className={`text-lg font-semibold ${
                  !notification.read
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {notification.title}
              </h3>
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                title="Usuń powiadomienie"
                aria-label="Usuń powiadomienie"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
              {notification.message}
            </p>

            {/* Metadata */}
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div className="bg-white/50 dark:bg-gray-900/30 rounded p-3 mb-3 text-sm">
                <pre className="text-gray-600 dark:text-gray-400 overflow-x-auto">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-between">
              <time
                className="text-sm text-gray-500 dark:text-gray-400"
                dateTime={notification.created_at}
              >
                {formatDate(notification.created_at)}
              </time>
              {!notification.read && (
                <Button
                  onClick={handleMarkAsRead}
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
    );
  }
);

NotificationCard.displayName = 'NotificationCard';
