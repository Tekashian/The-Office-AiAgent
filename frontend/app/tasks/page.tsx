
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Play, Pause, Trash2, Edit, Calendar, Mail, FileText, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  task_type: string;
  task_config: any;
  enabled: boolean;
  status: string;
  last_run: string | null;
  execution_count: number;
  created_at: string;
}

export default function TasksPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [jobName, setJobName] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'recurring'>('once');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [recurringType, setRecurringType] = useState('daily');
  const [jobType, setJobType] = useState('email');
  const [jobConfig, setJobConfig] = useState('{}');
  const [generatingConfig, setGeneratingConfig] = useState(false);

  const taskTypes = [
    { value: 'email', label: 'Wysyłka emaila', icon: Mail },
    { value: 'pdf', label: 'Generowanie PDF', icon: FileText },
    { value: 'scraping', label: 'Web Scraping', icon: Globe },
    { value: 'custom', label: 'Zadanie własne', icon: Clock },
  ];

  const recurringOptions = [
    { label: 'Codziennie', value: 'daily' },
    { label: 'Co tydzień', value: 'weekly' },
    { label: 'Co miesiąc', value: 'monthly' },
    { label: 'Co godzinę', value: 'hourly' },
  ];

  // Convert date/time to cron expression
  const dateToCron = (date: string, time: string): string => {
    const [hours, minutes] = time.split(':');
    const dateObj = new Date(date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    return `${minutes} ${hours} ${day} ${month} *`;
  };

  const recurringToCron = (type: string, time: string): string => {
    const [hours, minutes] = time.split(':');
    switch (type) {
      case 'hourly':
        return `${minutes} * * * *`;
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * 1`;
      case 'monthly':
        return `${minutes} ${hours} 1 * *`;
      default:
        return `${minutes} ${hours} * * *`;
    }
  };

  // Convert cron to readable format
  const cronToReadable = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    if (dayOfMonth !== '*' && month !== '*') {
      return `${dayOfMonth}.${month} o ${hour}:${minute.padStart(2, '0')}`;
    }
    
    if (hour === '*') {
      return `Co godzinę o :${minute.padStart(2, '0')}`;
    }
    
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Codziennie o ${hour}:${minute.padStart(2, '0')}`;
    }
    
    if (dayOfWeek !== '*') {
      const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      return `Każdy ${days[parseInt(dayOfWeek)] || 'Poniedziałek'} o ${hour}:${minute.padStart(2, '0')}`;
    }
    
    if (dayOfMonth !== '*') {
      return `Co miesiąc ${dayOfMonth}-go o ${hour}:${minute.padStart(2, '0')}`;
    }
    
    return cron;
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token');
        setJobs([]);
        return;
      }

      console.log('🔄 Fetching cron jobs...');
      const response = await fetch('http://localhost:3001/api/cron/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Cron jobs fetched:', data);
        setJobs(data.jobs || []);
      } else {
        console.error('❌ Failed to fetch jobs');
        setJobs([]);
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Zaloguj się aby korzystać z zaplanowanych zadań', 'error');
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      fetchJobs();
    };
    checkAuth();
  }, [fetchJobs, showToast]);

  // Scroll to highlighted task
  useEffect(() => {
    if (highlightId && jobs.length > 0 && !loading) {
      setTimeout(() => {
        const element = document.getElementById(`task-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2');
          }, 3000);
        }
      }, 300);
    }
  }, [highlightId, jobs, loading]);

  const openModal = (job?: CronJob) => {
    if (job) {
      setEditingJob(job);
      setJobName(job.name);
      setJobType(job.task_type);
      setJobConfig(JSON.stringify(job.task_config, null, 2));
      setScheduleType('recurring');
      setRecurringType('daily');
      setScheduledTime('09:00');
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingJob(null);
    setJobName('');
    setScheduleType('once');
    setScheduledDate('');
    setScheduledTime('09:00');
    setRecurringType('daily');
    setJobType('email');
    setJobConfig('{}');
  };

  const generateConfig = async () => {
    setGeneratingConfig(true);
    try {
      const token = await getAccessToken();
      
      const prompt = `Wygeneruj konfigurację JSON dla zadania typu "${jobType}" o nazwie "${jobName}". 
      
Typ zadania: ${taskTypes.find(t => t.value === jobType)?.label}

Zwróć TYLKO poprawny JSON bez dodatkowych komentarzy. Przykłady:

Email: {"recipient": "example@domain.com", "subject": "Temat", "body": "Treść wiadomości"}
PDF: {"filename": "raport.pdf", "title": "Tytuł Dokumentu", "content": "Treść dokumentu PDF...", "send_email": false, "recipient": "optional@email.com", "email_subject": "Twój PDF jest gotowy"}
Scraping: {"url": "https://example.com", "selector": ".class", "data_fields": ["field1", "field2"]}
Custom: {"action": "custom_action", "parameters": {}}`;

      const response = await fetch('http://localhost:3001/api/ai/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, type: 'json_config' })
      });

      if (response.ok) {
        const data = await response.json();
        let config = data.content || data.text || '{}';
        
        // Extract JSON if wrapped in markdown
        const jsonMatch = config.match(/```json\n?([\s\S]*?)\n?```/) || config.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          config = jsonMatch[1] || jsonMatch[0];
        }
        
        try {
          const parsed = JSON.parse(config);
          setJobConfig(JSON.stringify(parsed, null, 2));
          showToast('Konfiguracja wygenerowana przez AI', 'success');
        } catch {
          setJobConfig(config);
          showToast('Konfiguracja wygenerowana - sprawdź format', 'warning');
        }
      } else {
        showToast('Błąd generowania konfiguracji', 'error');
      }
    } catch (error) {
      console.error('Generate config error:', error);
      showToast('Błąd generowania konfiguracji', 'error');
    } finally {
      setGeneratingConfig(false);
    }
  };

  const handleSaveJob = async () => {
    if (!jobName) {
      showToast('Wypełnij nazwę zadania', 'error');
      return;
    }

    let cronExpression: string;
    if (scheduleType === 'once') {
      if (!scheduledDate) {
        showToast('Wybierz datę wykonania', 'error');
        return;
      }
      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (selectedDateTime <= new Date()) {
        showToast('Data musi być w przyszłości', 'error');
        return;
      }
      cronExpression = dateToCron(scheduledDate, scheduledTime);
    } else {
      cronExpression = recurringToCron(recurringType, scheduledTime);
    }

    try {
      const token = await getAccessToken();
      let config;
      try {
        config = JSON.parse(jobConfig);
      } catch {
        showToast('Nieprawidłowy format JSON w konfiguracji', 'error');
        return;
      }

      const url = editingJob
        ? `http://localhost:3001/api/cron/jobs/${editingJob.id}`
        : 'http://localhost:3001/api/cron/create';

      const response = await fetch(url, {
        method: editingJob ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: jobName,
          schedule: cronExpression,
          task_type: jobType,
          task_config: config,
          enabled: true
        })
      });

      if (response.ok) {
        showToast(editingJob ? 'Zadanie zaktualizowane' : 'Zadanie utworzone', 'success');
        setShowModal(false);
        resetForm();
        fetchJobs();
      } else {
        showToast('Błąd podczas zapisywania zadania', 'error');
      }
    } catch (error) {
      console.error('Save job error:', error);
      showToast('Błąd podczas zapisywania zadania', 'error');
    }
  };

  const handleToggleJob = async (job: CronJob) => {
    try {
      const token = await getAccessToken();
      const action = job.enabled ? 'stop' : 'start';
      
      const response = await fetch(`http://localhost:3001/api/cron/jobs/${job.id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast(job.enabled ? 'Zadanie zatrzymane' : 'Zadanie uruchomione', 'success');
        fetchJobs();
      } else {
        showToast('Błąd podczas zmiany statusu zadania', 'error');
      }
    } catch (error) {
      console.error('Toggle job error:', error);
      showToast('Błąd podczas zmiany statusu zadania', 'error');
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:3001/api/cron/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Zadanie usunięte', 'success');
        fetchJobs();
      } else {
        showToast('Błąd podczas usuwania zadania', 'error');
      }
    } catch (error) {
      console.error('Delete job error:', error);
      showToast('Błąd podczas usuwania zadania', 'error');
    }
  };

  const getTaskIcon = (taskType: string) => {
    const task = taskTypes.find(t => t.value === taskType);
    const Icon = task?.icon || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (job: CronJob) => {
    if (!job.enabled) return <Badge variant="default">Zatrzymane</Badge>;
    if (job.status === 'running') return <Badge variant="warning">Wykonywanie...</Badge>;
    if (job.status === 'active') return <Badge variant="success">Aktywne</Badge>;
    return <Badge variant="default">{job.status}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nigdy';
    return new Date(dateString).toLocaleString('pl-PL');
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Zaloguj się aby korzystać z zaplanowanych zadań</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Zaplanowane Zadania
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Automatyzuj wysyłanie emaili, generowanie PDF i inne zadania
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Nowe zadanie
        </Button>
      </div>

      {/* Jobs List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Ładowanie...</p>
            </CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 mb-4">Brak zaplanowanych zadań</p>
              <Button onClick={() => openModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Utwórz pierwsze zadanie
              </Button>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <div key={job.id} id={`task-${job.id}`} className="transition-all duration-300 rounded-lg">
              <Card>
                <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                      {getTaskIcon(job.task_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {job.name}
                        </h3>
                        {getStatusBadge(job)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {cronToReadable(job.schedule)}
                        </span>
                        <span>Typ: {taskTypes.find(t => t.value === job.task_type)?.label}</span>
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
                      onClick={() => handleToggleJob(job)}
                      title={job.enabled ? 'Zatrzymaj' : 'Uruchom'}
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
                      onClick={() => openModal(job)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingJob ? 'Edytuj zadanie' : 'Nowe zadanie'}
      >
        <div className="space-y-4">
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
              {taskTypes.map((type) => (
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
                    onChange={(e) => setScheduleType(e.target.value as 'once' | 'recurring')}
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
                    onChange={(e) => setScheduleType(e.target.value as 'once' | 'recurring')}
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
                      {recurringOptions.map((option) => (
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
                onClick={generateConfig}
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
                setShowModal(false);
                resetForm();
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleSaveJob}>
              {editingJob ? 'Zaktualizuj' : 'Utwórz'} zadanie
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
