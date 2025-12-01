import { useState, memo } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ScraperFormData } from '@/hooks/useScraper';

interface ScraperFormProps {
  onSubmit: (data: ScraperFormData) => void;
  onCancel: () => void;
  onAnalyzeUrl: (url: string) => Promise<{ selectors?: string; description?: string } | null>;
}

const SCHEDULE_OPTIONS = [
  { value: '', label: 'Jednorazowo (ręcznie)' },
  { value: '0 */6 * * *', label: 'Co 6 godzin' },
  { value: '0 */12 * * *', label: 'Co 12 godzin' },
  { value: '0 0 * * *', label: 'Codziennie (północ)' },
  { value: '0 9 * * *', label: 'Codziennie (9:00)' },
  { value: '0 0 * * 1', label: 'Co tydzień (poniedziałek)' },
  { value: '0 0 1 * *', label: 'Co miesiąc' },
];

export const ScraperForm = memo<ScraperFormProps>(
  ({ onSubmit, onCancel, onAnalyzeUrl }) => {
    const [formData, setFormData] = useState<ScraperFormData>({
      name: '',
      url: '',
      description: '',
      extraction_type: 'manual',
      selectors: '{}',
      ai_prompt: '',
      schedule: '',
      change_detection: false,
      enabled: true,
    });

    const [analyzing, setAnalyzing] = useState(false);

    const handleAnalyze = async () => {
      setAnalyzing(true);
      const result = await onAnalyzeUrl(formData.url);
      setAnalyzing(false);

      if (result) {
        setFormData((prev) => ({
          ...prev,
          selectors: result.selectors || prev.selectors,
          description: result.description || prev.description,
        }));
      }
    };

    const handleSubmit = () => {
      onSubmit(formData);
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Utwórz nowy scraper</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nazwa scrapera"
            placeholder="Monitor cen konkurencji"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="URL strony"
              placeholder="https://example.com/products"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              type="url"
              required
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Metoda ekstrakcji
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={formData.extraction_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extraction_type: e.target.value as 'manual' | 'ai' | 'hybrid',
                  })
                }
              >
                <option value="manual">Manual (CSS Selectors)</option>
                <option value="ai">AI (Natural Language)</option>
                <option value="hybrid">Hybrid (Both)</option>
              </select>
            </div>
          </div>

          {formData.extraction_type !== 'ai' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  CSS Selectors (JSON)
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={analyzing || !formData.url}
                >
                  <Sparkles className="mr-1 h-4 w-4" />
                  {analyzing ? 'Analizowanie...' : 'AI Analyze'}
                </Button>
              </div>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                rows={4}
                placeholder='{"price": ".product-price", "title": "h1.product-title"}'
                value={formData.selectors}
                onChange={(e) =>
                  setFormData({ ...formData, selectors: e.target.value })
                }
              />
            </div>
          )}

          {formData.extraction_type !== 'manual' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Prompt
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Extract product prices, names, and availability from this page"
                value={formData.ai_prompt}
                onChange={(e) =>
                  setFormData({ ...formData, ai_prompt: e.target.value })
                }
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Częstotliwość
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={formData.schedule || ''}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value || '' })
                }
              >
                {SCHEDULE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-8">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={formData.change_detection}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      change_detection: e.target.checked,
                    })
                  }
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Monitoruj zmiany
                </span>
              </label>
            </div>
          </div>

          <Input
            label="Opis (opcjonalnie)"
            placeholder="Monitors competitor pricing daily"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit}>Utwórz Scraper</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ScraperForm.displayName = 'ScraperForm';
