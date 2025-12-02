import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export interface AgentMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date | string;
}

interface UseAgentOptions {
  onPDFGenerated?: () => void;
  requireAuth?: boolean;
}

interface UseAgentReturn {
  messages: AgentMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  showExamples: boolean;
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  hideExamples: () => void;
  clearError: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// Use a fixed timestamp for initial message to avoid hydration mismatch
const INITIAL_TIMESTAMP = '2025-01-01T00:00:00.000Z';

const INITIAL_MESSAGE: AgentMessage = {
  id: 'initial',
  role: 'model',
  content: 'Cześć! Jestem Twoim AI agentem biurowym. Mogę pomóc Ci w automatyzacji zadań, wysyłaniu emaili, generowaniu PDF-ów i wiele więcej. W czym mogę Ci dziś pomóc?',
  timestamp: INITIAL_TIMESTAMP,
};

export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const { onPDFGenerated, requireAuth = true } = options;
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AgentMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Authentication check
  useEffect(() => {
    if (!requireAuth) return;

    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth');
      }
    };

    checkAuth();
  }, [router, requireAuth]);

  const hideExamples = useCallback(() => {
    setShowExamples(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    hideExamples();
    clearError();

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history (exclude initial greeting and empty messages)
      const conversationHistory = messages
        .filter((msg) => msg.id !== 'initial' && msg.content?.trim())
        .map((msg) => ({
          role: msg.role,
          text: msg.content,
        }));

      const response = await apiClient.post('/api/agent/chat', {
        message: userMessage.content,
        conversationHistory,
      });

      if (response.data.success) {
        const agentContent = response.data.data.content;

        // Check for PDF generation confirmation
        if (
          agentContent.includes('Twój raport PDF jest dostępny') ||
          agentContent.includes('PDF został wygenerowany')
        ) {
          onPDFGenerated?.();
        }

        // Parse timestamp safely - check both locations
        let timestamp = new Date();
        const timestampValue = response.data.timestamp || response.data.data.timestamp;
        if (timestampValue) {
          const parsedTime = new Date(timestampValue);
          if (!isNaN(parsedTime.getTime())) {
            timestamp = parsedTime;
          }
        }

        const agentMessage: AgentMessage = {
          id: `agent-${Date.now()}`,
          role: 'model',
          content: agentContent,
          timestamp,
        };

        setMessages((prev) => [...prev, agentMessage]);
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      const agentErrorMessage: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content:
          'Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości. Upewnij się, że backend jest uruchomiony i klucz API Gemini jest skonfigurowany.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentErrorMessage]);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, hideExamples, clearError, onPDFGenerated]);

  return {
    messages,
    input,
    isLoading,
    error,
    showExamples,
    setInput,
    sendMessage,
    hideExamples,
    clearError,
    messagesEndRef,
  };
}
