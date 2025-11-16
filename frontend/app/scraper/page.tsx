'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Play, 
  Plus, 
  Trash2, 
  Eye, 
  Sparkles, 
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';

interface ScrapeJob {
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

interface ScraperHistory {
  id: string;
  status: string;
  data_extracted: Record<string, unknown>;
  items_count: number;
  duration_ms: number;
  executed_at: string;
}

export default function ScraperPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
  const [history, setHistory] = useState<ScraperHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    extraction_type: 'manual' as 'manual' | 'ai' | 'hybrid',
    selectors: '{}',
    ai_prompt: '',
    schedule: '',
    change_detection: false,
    enabled: true
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/scraper');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch scrape jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (jobId: string) => {
    try {
      const response = await apiClient.get(`/api/scraper/${jobId}/history`);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const createJob = async () => {
    try {
      let parsedSelectors = {};
      if (formData.extraction_type !== 'ai') {
        try {
          parsedSelectors = JSON.parse(formData.selectors);
        } catch {
          alert('Invalid JSON format for selectors');
          return;
        }
      }

      await apiClient.post('/api/scraper/create', {
        ...formData,
        selectors: parsedSelectors
      });

      setShowCreateForm(false);
      resetForm();
      fetchJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create scrape job');
    }
  };

  const executeJob = async (jobId: string) => {
    try {
      setExecuting(jobId);
      const response = await apiClient.post(`/api/scraper/${jobId}/execute`);
      alert(`Scraping completed! ${response.data.changeDetected ? '✨ Changes detected!' : ''}`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to execute job:', error);
      alert('Scraping failed');
    } finally {
      setExecuting(null);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this scraper?')) return;
    
    try {
      await apiClient.delete(`/api/scraper/${jobId}`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const toggleJobEnabled = async (job: ScrapeJob) => {
    try {
      await apiClient.put(`/api/scraper/${job.id}`, {
        enabled: !job.enabled
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  };

  const analyzeUrl = async () => {
    if (!formData.url) {
      alert('Please enter a URL first');
      return;
    }

    try {
      const response = await apiClient.post('/api/scraper/analyze', {
        url: formData.url
      });
      
      const analysis = response.data.analysis;
      
      // Suggest selectors based on analysis
      if (analysis.suggestedContainers && analysis.suggestedContainers.length > 0) {
        const suggested = analysis.suggestedContainers[0];
        const suggestedSelectors = {
          container: suggested.selector,
          ...(analysis.aiSuggestions?.selectors || {})
        };
        setFormData(prev => ({
          ...prev,
          selectors: JSON.stringify(suggestedSelectors, null, 2),
          description: analysis.aiSuggestions?.page_type || ''
        }));
        
        alert(`✨ AI Analysis complete!\nPage type: ${analysis.aiSuggestions?.page_type || 'Unknown'}\nFound ${analysis.suggestedContainers.length} data containers`);
      }
    } catch (error) {
      console.error('Failed to analyze URL:', error);
      alert('Failed to analyze page');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      extraction_type: 'manual',
      selectors: '{}',
      ai_prompt: '',
      schedule: '',
      change_detection: false,
      enabled: true
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'success' | 'danger' | 'warning' | 'info'; label: string; icon: React.ComponentType<{className?: string}> }> = {
      completed: { variant: 'success', label: 'Completed', icon: CheckCircle },
      running: { variant: 'info', label: 'Running', icon: Loader2 },
      failed: { variant: 'danger', label: 'Failed', icon: AlertCircle },
      pending: { variant: 'warning', label: 'Pending', icon: Clock },
      scheduled: { variant: 'info', label: 'Scheduled', icon: Clock },
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Web Scraper
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Automatycznie zbieraj dane ze stron internetowych z pomocą AI
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy Scraper
        </Button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Utwórz nowy scraper</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nazwa scrapera"
              placeholder="Monitor cen konkurencji"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="URL strony"
                placeholder="https://example.com/products"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Metoda ekstrakcji
                </label>
                <select 
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  value={formData.extraction_type}
                  onChange={(e) => setFormData({...formData, extraction_type: e.target.value as 'manual' | 'ai' | 'hybrid'})}
                >
                  <option value="manual">Manual (CSS Selectors)</option>
                  <option value="ai">AI (Natural Language)</option>
                  <option value="hybrid">Hybrid (Both)</option>
                </select>
              </div>
            </div>

            {formData.extraction_type !== 'ai' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CSS Selectors (JSON)
                  </label>
                  <Button variant="ghost" size="sm" onClick={analyzeUrl}>
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Analyze
                  </Button>
                </div>
                <textarea
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 font-mono text-sm"
                  rows={4}
                  placeholder='{"price": ".product-price", "title": "h1.product-title"}'
                  value={formData.selectors}
                  onChange={(e) => setFormData({...formData, selectors: e.target.value})}
                />
              </div>
            )}

            {formData.extraction_type !== 'manual' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Prompt
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Extract product prices, names, and availability from this page"
                  value={formData.ai_prompt}
                  onChange={(e) => setFormData({...formData, ai_prompt: e.target.value})}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Częstotliwość
                </label>
                <select 
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  value={formData.schedule || ''}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value || undefined})}
                >
                  <option value="">Jednorazowo (ręcznie)</option>
                  <option value="0 */6 * * *">Co 6 godzin</option>
                  <option value="0 */12 * * *">Co 12 godzin</option>
                  <option value="0 0 * * *">Codziennie (północ)</option>
                  <option value="0 9 * * *">Codziennie (9:00)</option>
                  <option value="0 0 * * 1">Co tydzień (poniedziałek)</option>
                  <option value="0 0 1 * *">Co miesiąc</option>
                </select>
              </div>
              <div className="pt-8">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={formData.change_detection}
                    onChange={(e) => setFormData({...formData, change_detection: e.target.checked})}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Monitoruj zmiany
                  </span>
                </label>
              </div>
            </div>

            <Input
              label="Description (optional)"
              placeholder="Monitors competitor pricing daily"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={createJob}>
                Create Scraper
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading scrapers...</p>
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No scrapers yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first web scraper to start collecting data
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Scraper
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const statusConfig = getStatusBadge(job.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {job.name}
                        </h3>
                        <Badge variant={statusConfig.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {job.schedule && (
                          <Badge variant="default">
                            <Clock className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                        {job.change_detection && (
                          <Badge variant="info">
                            <Eye className="h-3 w-3 mr-1" />
                            Monitoring
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <Globe className="h-4 w-4" />
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                          {job.url}
                        </a>
                      </div>

                      {job.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {job.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                        <span>Type: {job.extraction_type.toUpperCase()}</span>
                        <span>Executions: {job.execution_count}</span>
                        <span>Last run: {job.last_run ? formatDate(job.last_run) : 'Never'}</span>
                        <span>Created: {formatDate(job.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job);
                          fetchHistory(job.id);
                          setShowHistory(true);
                        }}
                        variant="ghost"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => executeJob(job.id)}
                        disabled={executing === job.id}
                      >
                        {executing === job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={job.enabled}
                          onChange={() => toggleJobEnabled(job)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteJob(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {job.result_data && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Latest Result:
                      </h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {JSON.stringify(job.result_data, null, 2).substring(0, 500)}
                        {JSON.stringify(job.result_data, null, 2).length > 500 && '...'}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {showHistory && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Execution History: {selectedJob.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No execution history yet</p>
              ) : (
                <div className="space-y-4">
                  {history.map((record) => (
                    <div key={record.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={record.status === 'success' ? 'success' : 'danger'}>
                          {record.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(record.executed_at)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Items:</span> {record.items_count}
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span> {record.duration_ms}ms
                        </div>
                      </div>
                      {record.data_extracted && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700">
                            View extracted data
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                            {JSON.stringify(record.data_extracted, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
