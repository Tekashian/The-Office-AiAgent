'use client';

import { useState, Suspense } from 'react';
import { Plus, Globe, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useScraper, type ScraperFormData, type ScrapeJob } from '@/hooks/useScraper';
import { ScraperForm } from '@/components/scraper/ScraperForm';
import { ScraperJobCard } from '@/components/scraper/ScraperJobCard';
import { ScraperHistoryModal } from '@/components/scraper/ScraperHistoryModal';

function ScraperPageContent() {
  const { showToast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    jobs,
    history,
    selectedJob,
    highlightId,
    loading,
    executing,
    createJob,
    executeJob,
    deleteJob,
    toggleJobEnabled,
    analyzeUrl,
    fetchHistory,
    setSelectedJob,
  } = useScraper();

  const handleCreateJob = async (data: ScraperFormData) => {
    const success = await createJob(data);
    if (success) {
      showToast('Scraper utworzony pomyślnie!', 'success');
      setShowCreateForm(false);
    }
  };

  const handleExecuteJob = async (jobId: string) => {
    const result = await executeJob(jobId);
    if (result.success) {
      const message = result.changeDetected
        ? 'Scraping ukończony! ✨ Wykryto zmiany!'
        : 'Scraping ukończony!';
      showToast(message, 'success');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    await deleteJob(jobId);
    showToast('Scraper usunięty', 'success');
  };

  const handleViewHistory = (job: ScrapeJob) => {
    setSelectedJob(job);
    fetchHistory(job.id);
    setShowHistory(true);
  };

  const handleAnalyzeUrl = async (url: string) => {
    const result = await analyzeUrl(url);
    if (result) {
      showToast(
        '✨ AI Analysis complete! Found suggested selectors',
        'success'
      );
    }
    return result;
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

      {/* Create Form */}
      {showCreateForm && (
        <ScraperForm
          onSubmit={handleCreateJob}
          onCancel={() => setShowCreateForm(false)}
          onAnalyzeUrl={handleAnalyzeUrl}
        />
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Loading scrapers...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              No scrapers yet
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
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
          {jobs.map((job) => (
            <ScraperJobCard
              key={job.id}
              job={job}
              executing={executing === job.id}
              highlightId={highlightId}
              onExecute={() => handleExecuteJob(job.id)}
              onToggle={() => toggleJobEnabled(job)}
              onDelete={() => handleDeleteJob(job.id)}
              onViewHistory={() => handleViewHistory(job)}
            />
          ))}
        </div>
      )}

      {/* History Modal */}
      <ScraperHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        scraperName={selectedJob?.name || ''}
        history={history}
      />
    </div>
  );
}

export default function ScraperPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Ładowanie...</div>}>
      <ScraperPageContent />
    </Suspense>
  );
}
