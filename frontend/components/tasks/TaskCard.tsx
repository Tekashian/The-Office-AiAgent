'use client';

import React, { useEffect, useRef } from 'react';
import { Play, Pause, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CronJob } from '@/hooks/useTasks';
import { getTaskIcon, getTaskLabel, cronToReadable, formatDate } from '@/lib/taskUtils';

interface TaskCardProps {
  job: CronJob;
  highlightId: string | null;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_CONFIG = {
  running: { label: 'Wykonywanie...', variant: 'warning' as const },
  active: { label: 'Aktywne', variant: 'success' as const },
  stopped: { label: 'Zatrzymane', variant: 'default' as const },
};

export const TaskCard = React.memo(function TaskCard({
  job,
  highlightId,
  onToggle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll and highlight on mount if this is the highlighted task
  useEffect(() => {
    if (highlightId === job.id && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        cardRef.current?.classList.add(
          'ring-4',
          'ring-indigo-500',
          'ring-offset-2'
        );
        setTimeout(() => {
          cardRef.current?.classList.remove(
            'ring-4',
            'ring-indigo-500',
            'ring-offset-2'
          );
        }, 3000);
      }, 300);
    }
  }, [highlightId, job.id]);

  const getStatusBadge = () => {
    if (!job.enabled) {
      return <Badge variant="default">Zatrzymane</Badge>;
    }
    const config = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG];
    if (config) {
      return <Badge variant={config.variant}>{config.label}</Badge>;
    }
    return <Badge variant="default">{job.status}</Badge>;
  };

  const TaskIcon = getTaskIcon(job.task_type);

  return (
    <div
      ref={cardRef}
      id={`task-${job.id}`}
      className="transition-all duration-300 rounded-lg"
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <TaskIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {job.name}
                  </h3>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {cronToReadable(job.schedule)}
                  </span>
                  <span>Typ: {getTaskLabel(job.task_type)}</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Ostatnie uruchomienie: {formatDate(job.last_run)} •
                  Wykonano: {job.execution_count}x
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                title={job.enabled ? 'Zatrzymaj' : 'Uruchom'}
                aria-label={job.enabled ? 'Zatrzymaj zadanie' : 'Uruchom zadanie'}
              >
                {job.enabled ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                title="Edytuj"
                aria-label="Edytuj zadanie"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                title="Usuń"
                aria-label="Usuń zadanie"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
