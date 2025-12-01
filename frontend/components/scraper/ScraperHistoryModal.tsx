import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ScraperHistory } from '@/hooks/useScraper';

interface ScraperHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scraperName: string;
  history: ScraperHistory[];
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ScraperHistoryModal = memo<ScraperHistoryModalProps>(
  ({ isOpen, onClose, scraperName, history }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="max-h-[80vh] w-full max-w-4xl overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Execution History: {scraperName}</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                No execution history yet
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Badge
                        variant={
                          record.status === 'success' ? 'success' : 'danger'
                        }
                      >
                        {record.status}
                      </Badge>
                      <time
                        className="text-sm text-gray-500 dark:text-gray-400"
                        dateTime={record.executed_at}
                      >
                        {formatDate(record.executed_at)}
                      </time>
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Items:
                        </span>{' '}
                        {record.items_count}
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Duration:
                        </span>{' '}
                        {record.duration_ms}ms
                      </div>
                    </div>
                    {record.data_extracted && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                          View extracted data
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-800">
                          {JSON.stringify(record.data_extracted, null, 2)}
                        </pre>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

ScraperHistoryModal.displayName = 'ScraperHistoryModal';
