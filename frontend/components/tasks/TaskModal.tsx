'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CronJob } from '@/hooks/useTasks';
import { TASK_TYPES, RECURRING_OPTIONS, dateToCron, recurringToCron } from '@/lib/taskUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    schedule: string;
    task_type: string;
    task_config: Record<string, unknown>;
    enabled: boolean;
  }) => Promise<boolean>;
  onGenerateConfig: (taskType: string, jobName: string) => Promise<string | null>;
  editingJob: CronJob | null;
  generatingConfig: boolean;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  onGenerateConfig,
  editingJob,
  generatingConfig,
}: TaskModalProps) {
  const [jobName, setJobName] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'recurring'>('once');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [recurringType, setRecurringType] = useState('daily');
  const [jobType, setJobType] = useState('email');
  const [jobConfig, setJobConfig] = useState('{}');
  const [error, setError] = useState('');

  const resetForm = () => {
    setJobName('');
    setScheduleType('once');
    setScheduledDate('');
    setScheduledTime('09:00');
    setRecurringType('daily');
    setJobType('email');
    setJobConfig('{}');
    setError('');
  };

  useEffect(() => {
    if (editingJob) {
      // Queue state updates to avoid cascading renders warning
      queueMicrotask(() => {
        setJobName(editingJob.name);
        setJobType(editingJob.task_type);
        setJobConfig(JSON.stringify(editingJob.task_config, null, 2));
        setScheduleType('recurring');
        setRecurringType('daily');
        setScheduledTime('09:00');
      });
    } else if (isOpen && !editingJob) {
      queueMicrotask(() => {
        resetForm();
      });
    }
  }, [editingJob, isOpen]);

  const handleGenerateConfig = async () => {
    if (!jobName) {
      setError('Podaj nazwę zadania przed generowaniem konfiguracji');
      return;
    }
    const config = await onGenerateConfig(jobType, jobName);
    if (config) {
      setJobConfig(config);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!jobName) {
      setError('Wypełnij nazwę zadania');
      return;
    }

    let cronExpression: string;
    if (scheduleType === 'once') {
      if (!scheduledDate) {
        setError('Wybierz datę wykonania');
        return;
      }
      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (selectedDateTime <= new Date()) {
        setError('Data musi być w przyszłości');
        return;
      }
      cronExpression = dateToCron(scheduledDate, scheduledTime);
    } else {
      cronExpression = recurringToCron(recurringType, scheduledTime);
    }

    let config;
    try {
      config = JSON.parse(jobConfig);
    } catch {
      setError('Nieprawidłowy format JSON w konfiguracji');
      return;
    }

    const success = await onSubmit({
      name: jobName,
      schedule: cronExpression,
      task_type: jobType,
      task_config: config,
      enabled: true,
    });

    if (success) {
      resetForm();
      onClose();
    } else {
      setError('Błąd podczas zapisywania zadania');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={editingJob ? 'Edytuj zadanie' : 'Nowe zadanie'}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nazwa zadania"
          placeholder="Np. Cotygodniowy raport sprzedaży"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Typ zadania
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            {TASK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Harmonogram
          </label>
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scheduleType"
                  value="once"
                  checked={scheduleType === 'once'}
                  onChange={(e) => setScheduleType(e.target.value as 'once')}
                  className="mr-2"
                />
                Jednorazowo
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scheduleType"
                  value="recurring"
                  checked={scheduleType === 'recurring'}
                  onChange={(e) => setScheduleType(e.target.value as 'recurring')}
                  className="mr-2"
                />
                Cyklicznie
              </label>
            </div>

            {scheduleType === 'once' ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  label="Data"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  type="time"
                  label="Godzina"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Częstotliwość
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={recurringType}
                    onChange={(e) => setRecurringType(e.target.value)}
                  >
                    {RECURRING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="time"
                  label="O godzinie"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Konfiguracja (JSON)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateConfig}
              disabled={!jobName || generatingConfig}
            >
              {generatingConfig ? 'Generowanie...' : '✨ Wygeneruj AI'}
            </Button>
          </div>
          <Textarea
            placeholder='{"recipient": "email@example.com", "template_id": "..."}'
            rows={8}
            value={jobConfig}
            onChange={(e) => setJobConfig(e.target.value)}
            className="font-mono text-xs"
          />
          <p className="mt-1 text-xs text-gray-500">
            AI może automatycznie wygenerować konfigurację na podstawie typu zadania
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Anuluj
          </Button>
          <Button onClick={handleSubmit}>
            {editingJob ? 'Zaktualizuj' : 'Utwórz'} zadanie
          </Button>
        </div>
      </div>
    </Modal>
  );
}
