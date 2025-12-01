import { memo } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface AgentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const AgentInput = memo<AgentInputProps>(
  ({ value, onChange, onSend, disabled = false, isLoading = false }) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && !isLoading && value.trim()) {
          onSend();
        }
      }
    };

    return (
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="flex gap-3">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Opisz zadanie dla AI agenta..."
            className="min-h-[60px] resize-none"
            disabled={disabled || isLoading}
            aria-label="Wiadomość do AI agenta"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={onSend}
              disabled={!value.trim() || isLoading || disabled}
              className="h-full"
              aria-label="Wyślij wiadomość"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-full"
              aria-label="Sugestie AI"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Naciśnij Enter aby wysłać, Shift+Enter dla nowej linii
        </p>
      </div>
    );
  }
);

AgentInput.displayName = 'AgentInput';
