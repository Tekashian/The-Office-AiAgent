import { useState, useEffect, memo } from 'react';
import { Sparkles } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { PDFTemplate } from '@/hooks/usePDF';

interface PDFTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingTemplateId?: string | null;
  templates: PDFTemplate[];
}

const PDF_CATEGORIES = [
  'Faktura VAT',
  'Oferta handlowa',
  'Umowa',
  'Raport miesięczny',
  'Notatka',
  'Protokół',
  'Specyfikacja',
  'Potwierdzenie',
  'Inne',
];

export const PDFTemplateModal = memo<PDFTemplateModalProps>(
  ({ isOpen, onClose, onSave, editingTemplateId, templates }) => {
    const [templateName, setTemplateName] = useState('');
    const [templateContent, setTemplateContent] = useState('');
    const [templateCategory, setTemplateCategory] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load template data when editing
    useEffect(() => {
      if (editingTemplateId && templates.length > 0) {
        const template = templates.find((t) => t.id === editingTemplateId);
        if (template) {
          setTemplateName(template.name);
          setTemplateContent(template.content);
          setTemplateCategory(template.category);
        }
      } else {
        resetForm();
      }
    }, [editingTemplateId, templates]);

    const resetForm = () => {
      setTemplateName('');
      setTemplateContent('');
      setTemplateCategory('');
      setError(null);
    };

    const handleClose = () => {
      resetForm();
      onClose();
    };

    const handleGenerateAI = async () => {
      if (!templateCategory) {
        setError('Wybierz kategorię przed generowaniem');
        return;
      }

      setError(null);
      setGeneratingAI(true);

      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Brak autoryzacji, zaloguj się ponownie');
          return;
        }

        const response = await apiClient.post(
          '/api/pdf/templates/generate',
          {
            category: templateCategory,
            context: templateName,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data && response.data.content) {
          setTemplateContent(response.data.content);
        } else {
          setError('Błąd podczas generowania treści');
        }
      } catch (err) {
        console.error('Generate AI content error:', err);
        setError('Błąd podczas generowania treści');
      } finally {
        setGeneratingAI(false);
      }
    };

    const handleSave = async () => {
      if (!templateName || !templateContent) {
        setError('Wypełnij nazwę i treść szablonu');
        return;
      }

      setError(null);
      setSaving(true);

      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Brak autoryzacji, zaloguj się ponownie');
          return;
        }

        const url = editingTemplateId
          ? `/api/pdf/templates/${editingTemplateId}`
          : '/api/pdf/templates';

        const method = editingTemplateId ? 'put' : 'post';

        const response = await apiClient[method](
          url,
          {
            name: templateName,
            content: templateContent,
            category: templateCategory || 'Inne',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200 || response.data.success) {
          onSave();
          handleClose();
        } else {
          setError('Błąd podczas zapisywania szablonu');
        }
      } catch (err) {
        console.error('Save template error:', err);
        setError('Błąd podczas zapisywania szablonu');
      } finally {
        setSaving(false);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={editingTemplateId ? 'Edytuj szablon' : 'Nowy szablon'}
      >
        <div className="space-y-4">
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          <Input
            label="Nazwa szablonu"
            placeholder="Np. Faktura standardowa"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            required
          />

          <div>
            <label
              htmlFor="pdf-template-category"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kategoria
            </label>
            <select
              id="pdf-template-category"
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Wybierz kategorię</option>
              {PDF_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Treść szablonu
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAI}
              disabled={generatingAI || !templateCategory}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generatingAI ? 'Generowanie...' : 'Wygeneruj AI'}
            </Button>
          </div>

          <Textarea
            placeholder="Treść dokumentu..."
            rows={12}
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? 'Zapisywanie...'
                : editingTemplateId
                ? 'Zaktualizuj'
                : 'Utwórz'}{' '}
              szablon
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

PDFTemplateModal.displayName = 'PDFTemplateModal';
