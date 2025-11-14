'use client';

import React, { useState } from 'react';
import { Play, Pause, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function TasksPage() {
  const [taskName, setTaskName] = useState('');
  const [schedule, setSchedule] = useState('');

  const scheduledTasks = [
    {
      id: '1',
      name: 'Raport dzienny sprzedaży',
      schedule: '0 8 * * *',
      description: 'Co dzień o 8:00',
      status: 'active',
      lastRun: '2024-11-14 08:00',
      nextRun: '2024-11-15 08:00',
    },
    {
      id: '2',
      name: 'Backup bazy danych',
      schedule: '0 0 * * 0',
      description: 'Co niedzielę o północy',
      status: 'active',
      lastRun: '2024-11-10 00:00',
      nextRun: '2024-11-17 00:00',
    },
    {
      id: '3',
      name: 'Monitoring konkurencji',
      schedule: '0 */6 * * *',
      description: 'Co 6 godzin',
      status: 'paused',
      lastRun: '2024-11-14 06:00',
      nextRun: '-',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Zaplanowane Zadania
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Automatyzuj zadania za pomocą harmonogramu cron
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Nowe zadanie zaplanowane</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nazwa zadania"
                placeholder="Np. Raport dzienny"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Wyrażenie cron"
                  placeholder="0 8 * * *"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Typ zadania
                  </label>
                  <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                    <option>Email</option>
                    <option>PDF Generation</option>
                    <option>Web Scraping</option>
                    <option>AI Request</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  Anuluj
                </Button>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Utwórz zadanie
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktywne zadania</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {task.name}
                          </h3>
                          <Badge
                            variant={
                              task.status === 'active' ? 'success' : 'warning'
                            }
                          >
                            {task.status === 'active' ? 'Aktywne' : 'Wstrzymane'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                        <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Ostatnie: {task.lastRun}</span>
                          <span>Następne: {task.nextRun}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {task.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Przykłady Cron</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <code className="text-xs text-primary-600 dark:text-primary-400">
                  0 8 * * *
                </code>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Codziennie o 8:00
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <code className="text-xs text-primary-600 dark:text-primary-400">
                  0 */6 * * *
                </code>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Co 6 godzin
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <code className="text-xs text-primary-600 dark:text-primary-400">
                  0 0 * * 0
                </code>
                <p className="mt-1 text-xs text-xs text-gray-600 dark:text-gray-400">
                  Co niedzielę o północy
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                <code className="text-xs text-primary-600 dark:text-primary-400">
                  */15 * * * *
                </code>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Co 15 minut
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statystyki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Aktywne zadania
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  2
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Wykonane dziś
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  8
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
