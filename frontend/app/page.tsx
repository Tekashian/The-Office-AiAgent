'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Bot,
  Mail,
  FileText,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  tasks: {
    active: number;
    completedToday: number;
    pending: number;
    failed: number;
  };
  resources: {
    emailsSent: number;
    pdfFiles: number;
    emailsInbox: number;
    unreadNotifications: number;
  };
}

interface RecentTask {
  id: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  time: string;
  executionCount: number;
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check session first
      const session = await getSession();
      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      await fetchDashboardData();
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await apiClient.get('/api/dashboard/stats');
      setStats(statsResponse.data);

      // Fetch recent tasks
      const tasksResponse = await apiClient.get('/api/dashboard/recent-tasks?limit=5');
      setRecentTasks(tasksResponse.data.tasks);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // If 401, redirect to login
      if ((error as { response?: { status: number } }).response?.status === 401) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = stats ? [
    {
      name: 'Aktywne Zadania',
      value: stats.tasks.active.toString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Ukończone Dziś',
      value: stats.tasks.completedToday.toString(),
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      name: 'Oczekujące',
      value: stats.tasks.pending.toString(),
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      name: 'Błędy',
      value: stats.tasks.failed.toString(),
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
    },
  ] : [];

  const resourceStats = stats ? [
    {
      name: 'Wysłane Emaile',
      value: stats.resources.emailsSent,
      icon: Mail,
      link: '/email',
    },
    {
      name: 'Wygenerowane PDF',
      value: stats.resources.pdfFiles,
      icon: FileText,
      link: '/pdf',
    },
    {
      name: 'Skrzynka Email',
      value: stats.resources.emailsInbox,
      icon: Inbox,
      link: '/email-inbox',
    },
  ] : [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger'; label: string }> = {
      completed: { variant: 'success' as const, label: 'Ukończone' },
      in_progress: { variant: 'info' as const, label: 'W trakcie' },
      pending: { variant: 'warning' as const, label: 'Oczekuje' },
      failed: { variant: 'danger' as const, label: 'Błąd' },
      disabled: { variant: 'warning' as const, label: 'Wyłączone' },
    };
    return variants[status] || variants.pending;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: 'Email',
      pdf_generation: 'PDF',
      pdf: 'PDF',
      web_scraping: 'Web Scraping',
      scraping: 'Scraping',
      ai_request: 'AI',
      custom: 'Custom',
      scheduled: 'Zaplanowane',
    };
    return labels[type] || type;
  };

  // Show login prompt if not authenticated
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Bot className="h-16 w-16 mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Office Agent AI
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Inteligentny asystent do automatyzacji zadań biurowych
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Automatyzacja emaili i dokumentów</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Generowanie PDF i raportów</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">AI-powered zadania cykliczne</span>
              </div>
            </div>

            <Button 
              onClick={() => router.push('/auth')}
              className="w-full gap-2 relative overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/50"
              size="lg"
            >
              {/* Animated gradient background */}
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x"></span>
              
              {/* Shine effect */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></span>
              </span>
              
              {/* Content */}
              <span className="relative flex items-center gap-2">
                <Activity className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-semibold">Zaloguj się</span>
              </span>
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Nie masz konta? Zarejestruj się za darmo
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <Button className="gap-2" onClick={() => router.push('/tasks')}>
          <Bot className="h-4 w-4" />
          Nowe Zadanie
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Ładowanie danych...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statsConfig.map((stat) => (
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
                    </div>
                    <div className={`rounded-full bg-gray-100 p-3 dark:bg-gray-800 ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resource Stats */}
          <div className="grid gap-6 sm:grid-cols-3">
            {resourceStats.map((resource) => (
              <div 
                key={resource.name}
                onClick={() => router.push(resource.link)}
                className="cursor-pointer"
              >
                <Card hover>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/30">
                        <resource.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {resource.name}
                        </h3>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {resource.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ostatnie Zadania</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
                  Zobacz wszystkie
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Brak zadań. Utwórz swoje pierwsze zadanie!</p>
                </div>
              ) : (
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
                          {task.executionCount > 0 && (
                            <span className="text-xs text-gray-500">
                              Wykonano: {task.executionCount}x
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          {task.description}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {task.time}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push('/tasks')}
                      >
                        Szczegóły
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div onClick={() => router.push('/agent')} className="cursor-pointer">
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
            </div>

            <div onClick={() => router.push('/tasks')} className="cursor-pointer">
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
            </div>

            <div onClick={() => router.push('/notifications')} className="cursor-pointer">
              <Card hover>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                      <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Aktywność
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Zobacz historię powiadomień
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
