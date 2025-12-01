import { memo } from 'react';
import { Sparkles } from 'lucide-react';

interface AgentExamplesProps {
  onSelectPrompt: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  'Wygeneruj raport sprzedażowy za ostatni miesiąc',
  'Pobierz dane ze strony https://example.com',
  'Wyślij email do klienta z podsumowaniem',
  'Utwórz zadanie cykliczne co poniedziałek o 9:00',
];

export const AgentExamples = memo<AgentExamplesProps>(({ onSelectPrompt }) => {
  return (
    <div className="mt-8 space-y-3">
      <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
        Przykładowe polecenia:
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className="group rounded-lg border border-gray-200 bg-white p-3 text-left text-sm transition-all hover:border-primary-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            type="button"
            aria-label={`Użyj przykładowego polecenia: ${prompt}`}
          >
            <div className="flex items-start gap-2">
              <Sparkles
                className="mt-0.5 h-4 w-4 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              />
              <span className="text-gray-700 group-hover:text-primary-600 dark:text-gray-300 dark:group-hover:text-primary-400">
                {prompt}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

AgentExamples.displayName = 'AgentExamples';
