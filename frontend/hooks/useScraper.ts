import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

export interface ScrapeJob {
  id: string;
  name: string;
  url: string;
  description?: string;
  extraction_type: 'manual' | 'ai' | 'hybrid';
  selectors?: Record<string, string>;
  ai_prompt?: string;
  schedule?: string;
  enabled: boolean;
  status: string;
  change_detection: boolean;
  result_data?: Record<string, unknown>;
  execution_count: number;
  last_run?: string;
  created_at: string;
}

export interface ScraperHistory {
  id: string;
  status: string;
  data_extracted: Record<string, unknown>;
  items_count: number;
  duration_ms: number;
  executed_at: string;
}

export interface ScraperFormData {
  name: string;
  url: string;
  description: string;
  extraction_type: 'manual' | 'ai' | 'hybrid';
  selectors: string;
  ai_prompt: string;
  schedule: string;
  change_detection: boolean;
  enabled: boolean;
}

interface UseScraperReturn {
  // Data state
  jobs: ScrapeJob[];
  history: ScraperHistory[];
  selectedJob: ScrapeJob | null;
  highlightId: string | null;
  
  // UI state
  loading: boolean;
  executing: string | null;
  error: string | null;
  
  // Actions
  fetchJobs: () => Promise<void>;
  fetchHistory: (jobId: string) => Promise<void>;
  createJob: (data: ScraperFormData) => Promise<boolean>;
  executeJob: (jobId: string) => Promise<{ success: boolean; changeDetected?: boolean }>;
  deleteJob: (jobId: string) => Promise<void>;
  toggleJobEnabled: (job: ScrapeJob) => Promise<void>;
  analyzeUrl: (url: string) => Promise<{ selectors?: string; description?: string } | null>;
  setSelectedJob: (job: ScrapeJob | null) => void;
  clearError: () => void;
}

export function useScraper(): UseScraperReturn {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [history, setHistory] = useState<ScraperHistory[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all scrape jobs
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await apiClient.get('/api/scraper');
      setJobs(response.data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch scrape jobs:', err);
      setError('Nie udało się pobrać scraperów');
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Fetch history for a job
  const fetchHistory = useCallback(async (jobId: string) => {
    try {
      clearError();
      const response = await apiClient.get(`/api/scraper/${jobId}/history`);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Nie udało się pobrać historii');
    }
  }, [clearError]);

  // Create new scrape job
  const createJob = useCallback(
    async (data: ScraperFormData): Promise<boolean> => {
      try {
        clearError();

        let parsedSelectors = {};
        if (data.extraction_type !== 'ai') {
          try {
            parsedSelectors = JSON.parse(data.selectors);
          } catch {
            setError('Nieprawidłowy format JSON dla selektorów');
            return false;
          }
        }

        await apiClient.post('/api/scraper/create', {
          ...data,
          selectors: parsedSelectors,
        });

        await fetchJobs();
        return true;
      } catch (err) {
        console.error('Failed to create job:', err);
        setError('Nie udało się utworzyć scrapera');
        return false;
      }
    },
    [clearError, fetchJobs]
  );

  // Execute scrape job
  const executeJob = useCallback(
    async (jobId: string): Promise<{ success: boolean; changeDetected?: boolean }> => {
      try {
        clearError();
        setExecuting(jobId);
        
        const response = await apiClient.post(`/api/scraper/${jobId}/execute`);
        
        await fetchJobs();
        
        return {
          success: true,
          changeDetected: response.data.changeDetected,
        };
      } catch (err) {
        console.error('Failed to execute job:', err);
        setError('Scraping nie powiódł się');
        return { success: false };
      } finally {
        setExecuting(null);
      }
    },
    [clearError, fetchJobs]
  );

  // Delete scrape job
  const deleteJob = useCallback(
    async (jobId: string): Promise<void> => {
      try {
        clearError();
        await apiClient.delete(`/api/scraper/${jobId}`);
        await fetchJobs();
      } catch (err) {
        console.error('Failed to delete job:', err);
        setError('Nie udało się usunąć scrapera');
      }
    },
    [clearError, fetchJobs]
  );

  // Toggle job enabled status
  const toggleJobEnabled = useCallback(
    async (job: ScrapeJob): Promise<void> => {
      try {
        clearError();
        await apiClient.put(`/api/scraper/${job.id}`, {
          enabled: !job.enabled,
        });
        await fetchJobs();
      } catch (err) {
        console.error('Failed to toggle job:', err);
        setError('Nie udało się zmienić statusu scrapera');
      }
    },
    [clearError, fetchJobs]
  );

  // Analyze URL with AI
  const analyzeUrl = useCallback(
    async (url: string): Promise<{ selectors?: string; description?: string } | null> => {
      if (!url) {
        setError('Wprowadź URL przed analizą');
        return null;
      }

      try {
        clearError();
        const response = await apiClient.post('/api/scraper/analyze', { url });

        const analysis = response.data.analysis;

        if (analysis.suggestedContainers && analysis.suggestedContainers.length > 0) {
          const suggested = analysis.suggestedContainers[0];
          const suggestedSelectors = {
            container: suggested.selector,
            ...(analysis.aiSuggestions?.selectors || {}),
          };

          return {
            selectors: JSON.stringify(suggestedSelectors, null, 2),
            description: analysis.aiSuggestions?.page_type || '',
          };
        }

        return null;
      } catch (err) {
        console.error('Failed to analyze URL:', err);
        setError('Nie udało się przeanalizować strony');
        return null;
      }
    },
    [clearError]
  );

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    // Data
    jobs,
    history,
    selectedJob,
    highlightId,

    // UI state
    loading,
    executing,
    error,

    // Actions
    fetchJobs,
    fetchHistory,
    createJob,
    executeJob,
    deleteJob,
    toggleJobEnabled,
    analyzeUrl,
    setSelectedJob,
    clearError,
  };
}
