'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getCurrentUser } from '@/lib/auth';
import { useTasks, CronJob } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';

export default function TasksPage() {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);

  const {
    jobs,
    loading,
    highlightId,
    generatingConfig,
    createJob,
    updateJob,
    deleteJob,
    toggleJob,
    generateConfig,
  } = useTasks();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Zaloguj się aby korzystać z zaplanowanych zadań', 'error');
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [showToast]);

  const handleCreateOrUpdateJob = async (data: any) => {
    if (editingJob) {
      const success = await updateJob(editingJob.id, data);
      if (success) {
        showToast('Zadanie zaktualizowane', 'success');
        return true;
      } else {
        showToast('Błąd podczas aktualizacji zadania', 'error');
        return false;
      }
    } else {
      const success = await createJob(data);
      if (success) {
        showToast('Zadanie utworzone', 'success');
        return true;
      } else {
        showToast('Błąd podczas tworzenia zadania', 'error');
        return false;
      }
    }
  };

  const handleToggleJob = async (job: CronJob) => {
    const success = await toggleJob(job);
    if (success) {
      showToast(
        job.enabled ? 'Zadanie zatrzymane' : 'Zadanie uruchomione',
        'success'
      );
    } else {
      showToast('Błąd podczas zmiany statusu zadania', 'error');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) return;

    const success = await deleteJob(jobId);
    if (success) {
      showToast('Zadanie usunięte', 'success');
    } else {
      showToast('Błąd podczas usuwania zadania', 'error');
    }
  };

  const handleGenerateConfig = async (
    taskType: string,
    jobName: string
  ): Promise<string | null> => {
    const config = await generateConfig(taskType, jobName);
    if (config) {
      showToast('Konfiguracja wygenerowana przez AI', 'success');
      return config;
    } else {
      showToast('Błąd generowania konfiguracji', 'error');
      return null;
    }
  };

  const openModal = (job?: CronJob) => {
    setEditingJob(job || null);
    setShowModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">
              Zaloguj się aby korzystać z zaplanowanych zadań
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
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Loading tasks...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Brak zaplanowanych zadań
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Utwórz pierwsze zadanie aby zautomatyzować swoje procesy
            </p>
            <Button onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Utwórz pierwsze zadanie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <TaskCard
              key={job.id}
              job={job}
              highlightId={highlightId}
              onToggle={() => handleToggleJob(job)}
              onEdit={() => openModal(job)}
              onDelete={() => handleDeleteJob(job.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <TaskModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingJob(null);
        }}
        onSubmit={handleCreateOrUpdateJob}
        onGenerateConfig={handleGenerateConfig}
        editingJob={editingJob}
        generatingConfig={generatingConfig}
      />
    </div>
  );
}
