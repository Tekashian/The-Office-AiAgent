import { memo, useEffect } from 'react';
import { 
  Globe, 
  Play, 
  Trash2, 
  History, 
  Clock, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ScrapeJob } from '@/hooks/useScraper';

interface ScraperJobCardProps {
  job: ScrapeJob;
  executing: boolean;
  highlightId: string | null;
  onExecute: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
}

const STATUS_CONFIG = {
  completed: { variant: 'success' as const, label: 'Completed', icon: CheckCircle },
  running: { variant: 'info' as const, label: 'Running', icon: Loader2 },
  failed: { variant: 'danger' as const, label: 'Failed', icon: AlertCircle },
  pending: { variant: 'warning' as const, label: 'Pending', icon: Clock },
  scheduled: { variant: 'info' as const, label: 'Scheduled', icon: Clock },
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ScraperJobCard = memo<ScraperJobCardProps>(
  ({ job, executing, highlightId, onExecute, onToggle, onDelete, onViewHistory }) => {
    const statusConfig = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;

    // Scroll to highlighted scraper
    useEffect(() => {
      if (highlightId === job.id) {
        setTimeout(() => {
          const element = document.getElementById(`scraper-${job.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2');
            }, 3000);
          }
        }, 300);
      }
    }, [highlightId, job.id]);

    const handleDelete = () => {
      if (confirm(`Czy na pewno chcesz usunąć scraper "${job.name}"?`)) {
        onDelete();
      }
    };

    return (
      <div id={`scraper-${job.id}`} className="rounded-lg transition-all duration-300">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {job.name}
                  </h3>
                  <Badge variant={statusConfig.variant}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                  {job.schedule && (
                    <Badge variant="default">
                      <Clock className="mr-1 h-3 w-3" />
                      Scheduled
                    </Badge>
                  )}
                  {job.change_detection && (
                    <Badge variant="info">
                      <Eye className="mr-1 h-3 w-3" />
                      Monitoring
                    </Badge>
                  )}
                </div>

                <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {job.url}
                  </a>
                </div>

                {job.description && (
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    {job.description}
                  </p>
                )}

                <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                  <span>Type: {job.extraction_type.toUpperCase()}</span>
                  <span>Executions: {job.execution_count}</span>
                  <span>Last run: {formatDate(job.last_run || '')}</span>
                  <span>Created: {formatDate(job.created_at)}</span>
                </div>
              </div>

              <div className="ml-4 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onViewHistory}
                  variant="ghost"
                  aria-label="Zobacz historię"
                >
                  <History className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  onClick={onExecute}
                  disabled={executing}
                  aria-label="Uruchom scraper"
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={job.enabled}
                    onChange={onToggle}
                    aria-label={job.enabled ? 'Wyłącz scraper' : 'Włącz scraper'}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-indigo-800"></div>
                </label>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                  aria-label="Usuń scraper"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {job.result_data && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Latest Result:
                </h4>
                <pre className="overflow-x-auto text-xs text-gray-600 dark:text-gray-400">
                  {JSON.stringify(job.result_data, null, 2).substring(0, 500)}
                  {JSON.stringify(job.result_data, null, 2).length > 500 && '...'}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

ScraperJobCard.displayName = 'ScraperJobCard';
