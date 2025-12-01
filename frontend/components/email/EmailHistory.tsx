import { memo } from 'react';
import { Paperclip, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { SentEmail } from '@/hooks/useEmail';

interface EmailHistoryProps {
  emails: SentEmail[];
  loading: boolean;
  maxItems?: number;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const EmailHistory = memo<EmailHistoryProps>(
  ({ emails, loading, maxItems = 5 }) => {
    const displayEmails = emails.slice(0, maxItems);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie emaile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ładowanie...
              </p>
            </div>
          ) : emails.length === 0 ? (
            <div className="py-8 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Brak historii emaili
              </p>
            </div>
          ) : (
            displayEmails.map((email) => (
              <article
                key={email.id}
                className="rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-md dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {email.subject}
                    </h3>
                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {email.recipient}
                    </p>
                    {email.has_attachments && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <Paperclip className="h-3 w-3" aria-hidden="true" />
                        <span>
                          {email.attachments_count} załącznik
                          {email.attachments_count > 1 ? 'i' : ''}
                        </span>
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={email.status === 'sent' ? 'success' : 'danger'}
                    aria-label={
                      email.status === 'sent'
                        ? 'Email wysłany'
                        : 'Błąd wysyłania'
                    }
                  >
                    {email.status === 'sent' ? 'Wysłane' : 'Błąd'}
                  </Badge>
                </div>
                <time
                  className="mt-2 block text-xs text-gray-400"
                  dateTime={email.sent_at}
                >
                  {formatDate(email.sent_at)}
                </time>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    );
  }
);

EmailHistory.displayName = 'EmailHistory';
