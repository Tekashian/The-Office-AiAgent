import { memo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmailErrorProps {
  message: string;
  onDismiss: () => void;
}

export const EmailError = memo<EmailErrorProps>(({ message, onDismiss }) => {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle
        className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
        aria-hidden="true"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {message}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        aria-label="Zamknij komunikat o błędzie"
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
});

EmailError.displayName = 'EmailError';
