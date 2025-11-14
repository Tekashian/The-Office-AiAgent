'use client';

import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const stats = [
  {
    name: 'Aktywne Zadania',
    value: '12',
    change: '+4.75%',
    trend: 'up',
    icon: Activity,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Ukończone Dziś',
    value: '24',
    change: '+12.5%',
    trend: 'up',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    name: 'Oczekujące',
    value: '8',
    change: '-2.4%',
    trend: 'down',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    name: 'Błędy',
    value: '2',
    change: '-50%',
    trend: 'down',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
  },
];

const recentTasks = [
  {
    id: '1',
    type: 'email',
    description: 'Wysłanie raportu miesięcznego do zespołu',
    status: 'completed',
    priority: 'high',
    time: '5 min temu',
  },
  {
    id: '2',
    type: 'pdf_generation',
    description: 'Generowanie faktury #2024-001',
    status: 'in_progress',
    priority: 'urgent',
    time: '12 min temu',
  },
  {
    id: '3',
    type: 'web_scraping',
    description: 'Zbieranie danych konkurencji',
    status: 'in_progress',
    priority: 'medium',
    time: '25 min temu',
  },
  {
    id: '4',
    type: 'ai_request',
    description: 'Analiza sentiment w opiniach klientów',
    status: 'pending',
    priority: 'low',
    time: '1 godz. temu',
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger'; label: string }> = {
    completed: { variant: 'success' as const, label: 'Ukończone' },
    in_progress: { variant: 'info' as const, label: 'W trakcie' },
    pending: { variant: 'warning' as const, label: 'Oczekuje' },
    failed: { variant: 'danger' as const, label: 'Błąd' },
  };
  return variants[status] || variants.pending;
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    email: 'Email',
    pdf_generation: 'PDF',
    web_scraping: 'Web Scraping',
    ai_request: 'AI Request',
    scheduled: 'Zaplanowane',
  };
  return labels[type] || type;
};

export default function Home() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Witaj ponownie! Oto przegląd aktywności Twojego AI agenta.
          </p>
        </div>
        <Button className="gap-2">
          <Bot className="h-4 w-4" />
          Nowe Zadanie AI
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <TrendingUp
                      className={`h-4 w-4 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    />
                    <span
                      className={
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`rounded-full bg-gray-100 p-3 dark:bg-gray-800 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ostatnie Zadania</CardTitle>
            <Button variant="ghost" size="sm">
              Zobacz wszystkie
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{getTypeLabel(task.type)}</Badge>
                    <Badge {...getStatusBadge(task.status)}>
                      {getStatusBadge(task.status).label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {task.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {task.time}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Szczegóły
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Chat z AI
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rozpocznij rozmowę z agentem
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Automatyzacja
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Zarządzaj zadaniami cyklicznymi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Raporty
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Wygeneruj raport aktywności
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
