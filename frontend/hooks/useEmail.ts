import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  usage_count: number;
  is_favorite: boolean;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
}

export interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string;
  has_attachments: boolean;
  attachments_count: number;
}

interface UseEmailOptions {
  requireAuth?: boolean;
}

interface UseEmailReturn {
  // Form state
  recipient: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  
  // UI state
  sending: boolean;
  uploading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Templates
  templates: EmailTemplate[];
  
  // History
  emailHistory: SentEmail[];
  loadingHistory: boolean;
  
  // Actions
  setRecipient: (value: string) => void;
  setSubject: (value: string) => void;
  setBody: (value: string) => void;
  sendEmail: () => Promise<boolean>;
  uploadAttachment: (file: File) => Promise<boolean>;
  removeAttachment: (id: string) => void;
  useTemplate: (template: EmailTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearForm: () => void;
  clearError: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useEmail(options: UseEmailOptions = {}): UseEmailReturn {
  const { requireAuth = true } = options;
  const router = useRouter();

  // Form state
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  // UI state
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailHistory, setEmailHistory] = useState<SentEmail[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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
        console.error('❌ No auth token found for templates');
        setTemplates([]);
        return;
      }

      const response = await apiClient.get('/api/email-templates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch templates:', err);
      setTemplates([]);
    }
  }, []);

  // Fetch email history
  const refreshHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token found for history');
        setEmailHistory([]);
        return;
      }

      const response = await apiClient.get('/api/email/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEmailHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch email history:', err);
      setEmailHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      refreshTemplates();
      refreshHistory();
    }
  }, [isAuthenticated, refreshTemplates, refreshHistory]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearForm = useCallback(() => {
    setRecipient('');
    setSubject('');
    setBody('');
    setAttachments([]);
    clearError();
  }, [clearError]);

  // Send email
  const sendEmail = useCallback(async (): Promise<boolean> => {
    // Validation
    if (!recipient || !subject || !body) {
      setError('Wypełnij wszystkie wymagane pola');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      setError('Nieprawidłowy adres email');
      return false;
    }

    clearError();
    setSending(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Brak autoryzacji, zaloguj się ponownie');
        return false;
      }

      const response = await apiClient.post(
        '/api/email/send',
        {
          to: recipient,
          subject,
          body,
          attachments: attachments.map((a) => ({
            filename: a.filename,
            path: a.file_path,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success || response.status === 200) {
        clearForm();
        await refreshHistory();
        return true;
      }

      setError(response.data.error || 'Błąd podczas wysyłania emaila');
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Send email error:', err);
      return false;
    } finally {
      setSending(false);
    }
  }, [recipient, subject, body, attachments, clearForm, clearError, refreshHistory]);

  // Upload attachment
  const uploadAttachment = useCallback(
    async (file: File): Promise<boolean> => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`Plik jest za duży (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
        return false;
      }

      clearError();
      setUploading(true);

      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Brak autoryzacji, zaloguj się ponownie');
          return false;
        }

        const formData = new FormData();
        formData.append('attachment', file);

        const response = await fetch(
          'http://localhost:3001/api/email-templates/upload-attachment',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAttachments((prev) => [...prev, data.attachment]);
          return true;
        }

        setError('Błąd podczas przesyłania załącznika');
        return false;
      } catch (err) {
        console.error('Upload error:', err);
        setError('Błąd podczas przesyłania załącznika');
        return false;
      } finally {
        setUploading(false);
      }
    },
    [clearError]
  );

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Use template
  const useTemplate = useCallback(
    async (template: EmailTemplate) => {
      setSubject(template.subject);
      setBody(template.body);

      // Increment usage count
      try {
        const token = await getAccessToken();
        if (token) {
          await apiClient.post(
            `/api/email-templates/${template.id}/use`,
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

        const response = await apiClient.delete(`/api/email-templates/${id}`, {
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
    recipient,
    subject,
    body,
    attachments,

    // UI state
    sending,
    uploading,
    isAuthenticated,
    error,

    // Data
    templates,
    emailHistory,
    loadingHistory,

    // Actions
    setRecipient,
    setSubject,
    setBody,
    sendEmail,
    uploadAttachment,
    removeAttachment,
    useTemplate,
    deleteTemplate,
    refreshTemplates,
    refreshHistory,
    clearForm,
    clearError,
  };
}
