'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAccessToken } from '@/lib/auth';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  task_type: string;
  task_config: Record<string, unknown>;
  enabled: boolean;
  status: string;
  last_run: string | null;
  execution_count: number;
  created_at: string;
}

export interface TaskFormData {
  name: string;
  scheduleType: 'once' | 'recurring';
  scheduledDate: string;
  scheduledTime: string;
  recurringType: string;
  taskType: string;
  taskConfig: string;
}

export function useTasks() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingConfig, setGeneratingConfig] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAccessToken();
      
      if (!token) {
        setError('Authentication required');
        setJobs([]);
        return;
      }

      console.log('🔄 Fetching cron jobs...');
      const response = await fetch('http://localhost:3001/api/cron/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Cron jobs fetched:', data);
        setJobs(data.jobs || []);
      } else {
        setError('Failed to fetch jobs');
        setJobs([]);
      }
    } catch (err) {
      console.error('❌ Error fetching jobs:', err);
      setError('Error fetching jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const createJob = async (data: {
    name: string;
    schedule: string;
    task_type: string;
    task_config: Record<string, unknown>;
    enabled: boolean;
  }): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const response = await fetch('http://localhost:3001/api/cron/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchJobs();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Create job error:', err);
      return false;
    }
  };

  const updateJob = async (
    jobId: string,
    data: {
      name: string;
      schedule: string;
      task_type: string;
      task_config: Record<string, unknown>;
      enabled: boolean;
    }
  ): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `http://localhost:3001/api/cron/jobs/${jobId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        await fetchJobs();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update job error:', err);
      return false;
    }
  };

  const deleteJob = async (jobId: string): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `http://localhost:3001/api/cron/jobs/${jobId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        await fetchJobs();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete job error:', err);
      return false;
    }
  };

  const toggleJob = async (job: CronJob): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const action = job.enabled ? 'stop' : 'start';

      const response = await fetch(
        `http://localhost:3001/api/cron/jobs/${job.id}/${action}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        await fetchJobs();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Toggle job error:', err);
      return false;
    }
  };

  const generateConfig = async (
    taskType: string,
    jobName: string
  ): Promise<string | null> => {
    setGeneratingConfig(true);
    try {
      const token = await getAccessToken();

      const taskTypeLabels: Record<string, string> = {
        email: 'Wysyłka emaila',
        pdf: 'Generowanie PDF',
        scraping: 'Web Scraping',
        custom: 'Zadanie własne',
      };

      const prompt = `Wygeneruj konfigurację JSON dla zadania typu "${taskType}" o nazwie "${jobName}". 
      
Typ zadania: ${taskTypeLabels[taskType] || taskType}

Zwróć TYLKO poprawny JSON bez dodatkowych komentarzy. Przykłady:

Email: {"recipient": "example@domain.com", "subject": "Temat", "body": "Treść wiadomości"}
PDF: {"filename": "raport.pdf", "title": "Tytuł Dokumentu", "content": "Treść dokumentu PDF...", "send_email": false, "recipient": "optional@email.com", "email_subject": "Twój PDF jest gotowy"}
Scraping: {"url": "https://example.com", "selector": ".class", "data_fields": ["field1", "field2"]}
Custom: {"action": "custom_action", "parameters": {}}`;

      const response = await fetch('http://localhost:3001/api/ai/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, type: 'json_config' }),
      });

      if (response.ok) {
        const data = await response.json();
        let config = data.content || data.text || '{}';

        // Extract JSON if wrapped in markdown
        const jsonMatch =
          config.match(/```json\n?([\s\S]*?)\n?```/) ||
          config.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          config = jsonMatch[1] || jsonMatch[0];
        }

        try {
          const parsed = JSON.parse(config);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return config;
        }
      }
      return null;
    } catch (err) {
      console.error('Generate config error:', err);
      return null;
    } finally {
      setGeneratingConfig(false);
    }
  };

  return {
    jobs,
    loading,
    error,
    highlightId,
    generatingConfig,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    toggleJob,
    generateConfig,
  };
}
