import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api';

export interface PDFTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  usage_count: number;
  is_favorite: boolean;
}

export interface PDFFile {
  id: string;
  filename: string;
  title: string;
  file_size: number;
  created_at: string;
  downloadUrl: string;
}

interface UsePDFOptions {
  requireAuth?: boolean;
  refreshKey?: number;
}

interface UsePDFReturn {
  // Form state
  title: string;
  content: string;
  
  // UI state
  generating: boolean;
  isAuthenticated: boolean;
  error: string | null;
  highlightId: string | null;
  
  // Data
  templates: PDFTemplate[];
  pdfFiles: PDFFile[];
  loadingFiles: boolean;
  
  // Actions
  setTitle: (value: string) => void;
  setContent: (value: string) => void;
  generatePDF: () => Promise<boolean>;
  downloadPDF: (pdf: PDFFile) => Promise<void>;
  deletePDF: (id: string) => Promise<void>;
  useTemplate: (template: PDFTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  clearForm: () => void;
  clearError: () => void;
}

export function usePDF(options: UsePDFOptions = {}): UsePDFReturn {
  const { requireAuth = true, refreshKey = 0 } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // UI state
  const [generating, setGenerating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Authentication check
  useEffect(() => {
    if (!requireAuth) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          setIsAuthenticated(false);
          return;
        }
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [requireAuth]);

  // Fetch templates
  const refreshTemplates = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token found for PDF templates');
        setTemplates([]);
        return;
      }

      const response = await apiClient.get('/api/pdf/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch PDF templates:', err);
      setTemplates([]);
    }
  }, []);

  // Fetch PDF files
  const refreshFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token found for PDF files');
        setPdfFiles([]);
        return;
      }

      const response = await apiClient.get('/api/pdf/list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPdfFiles(response.data.pdfs || []);
    } catch (err) {
      console.error('❌ Failed to fetch PDF files:', err);
      setPdfFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      refreshTemplates();
      refreshFiles();
    }
  }, [isAuthenticated, refreshTemplates, refreshFiles]);

  // Refetch files when refreshKey changes (from context)
  useEffect(() => {
    if (isAuthenticated && refreshKey > 0) {
      refreshFiles();
    }
  }, [refreshKey, isAuthenticated, refreshFiles]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearForm = useCallback(() => {
    setTitle('');
    setContent('');
    clearError();
  }, [clearError]);

  // Generate PDF
  const generatePDF = useCallback(async (): Promise<boolean> => {
    // Validation
    if (!title || !content) {
      setError('Wypełnij tytuł i treść dokumentu');
      return false;
    }

    clearError();
    setGenerating(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Brak autoryzacji, zaloguj się ponownie');
        return false;
      }

      const response = await apiClient.post(
        '/api/pdf/generate',
        {
          title,
          content,
          filename: title,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.pdf) {
        clearForm();
        await refreshFiles();

        // Auto download
        const downloadUrl = `http://localhost:3001${response.data.pdf.downloadUrl}`;
        const downloadResponse = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.pdf.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
      }

      setError(response.data.error || 'Błąd podczas generowania PDF');
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Generate PDF error:', err);
      return false;
    } finally {
      setGenerating(false);
    }
  }, [title, content, clearForm, clearError, refreshFiles]);

  // Download PDF
  const downloadPDF = useCallback(async (pdf: PDFFile): Promise<void> => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Brak autoryzacji, zaloguj się ponownie');
        return;
      }

      const response = await fetch(`http://localhost:3001${pdf.downloadUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download PDF error:', err);
      setError('Błąd podczas pobierania PDF');
    }
  }, []);

  // Delete PDF
  const deletePDF = useCallback(
    async (id: string): Promise<void> => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Brak autoryzacji, zaloguj się ponownie');
          return;
        }

        const response = await apiClient.delete(`/api/pdf/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 || response.data.success) {
          await refreshFiles();
        } else {
          setError('Błąd podczas usuwania PDF');
        }
      } catch (err) {
        console.error('Delete PDF error:', err);
        setError('Błąd podczas usuwania PDF');
      }
    },
    [refreshFiles]
  );

  // Use template
  const useTemplate = useCallback(
    async (template: PDFTemplate) => {
      setTitle(template.name);
      setContent(template.content);

      // Increment usage count
      try {
        const token = await getAccessToken();
        if (token) {
          await apiClient.post(
            `/api/pdf/templates/${template.id}/use`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          await refreshTemplates();
        }
      } catch (err) {
        console.error('Failed to update template usage:', err);
      }
    },
    [refreshTemplates]
  );

  // Delete template
  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Brak autoryzacji, zaloguj się ponownie');
          return;
        }

        const response = await apiClient.delete(`/api/pdf/templates/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 || response.data.success) {
          await refreshTemplates();
        } else {
          setError('Błąd podczas usuwania szablonu');
        }
      } catch (err) {
        console.error('Delete template error:', err);
        setError('Błąd podczas usuwania szablonu');
      }
    },
    [refreshTemplates]
  );

  return {
    // Form state
    title,
    content,

    // UI state
    generating,
    isAuthenticated,
    error,
    highlightId,

    // Data
    templates,
    pdfFiles,
    loadingFiles,

    // Actions
    setTitle,
    setContent,
    generatePDF,
    downloadPDF,
    deletePDF,
    useTemplate,
    deleteTemplate,
    refreshTemplates,
    refreshFiles,
    clearForm,
    clearError,
  };
}
