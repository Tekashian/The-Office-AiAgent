import { useState, useEffect, memo } from 'react';
import { getAccessToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { EmailTemplate } from '@/hooks/useEmail';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingTemplateId?: string | null;
  templates: EmailTemplate[];
}

const TEMPLATE_CATEGORIES = [
  'Oferta handlowa',
  'Raport',
  'Follow-up',
  'Przypomnienie',
  'Zaproszenie',
  'Podziękowanie',
  'Informacja',
  'Newsletter',
  'Faktura',
  'Potwierdzenie',
];

export const TemplateModal = memo<TemplateModalProps>(
  ({ isOpen, onClose, onSave, editingTemplateId, templates }) => {
    const [templateName, setTemplateName] = useState('');
    const [templateSubject, setTemplateSubject] = useState('');
    const [templateBody, setTemplateBody] = useState('');
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
          setTemplateSubject(template.subject);
          setTemplateBody(template.body);
          setTemplateCategory(template.category);
        }
      } else {
        resetForm();
      }
    }, [editingTemplateId, templates]);

    const resetForm = () => {
      setTemplateName('');
      setTemplateSubject('');
      setTemplateBody('');
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
          '/api/email-templates/generate',
          {
            category: templateCategory,
            context: templateName,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data && response.data.subject && response.data.body) {
          setTemplateSubject(response.data.subject);
          setTemplateBody(response.data.body);
        } else {
          setError('Błąd podczas generowania szablonu');
        }
      } catch (err) {
        console.error('Generate AI template error:', err);
        setError('Błąd podczas generowania szablonu');
      } finally {
        setGeneratingAI(false);
      }
    };

    const handleSave = async () => {
      if (!templateName || !templateSubject || !templateBody) {
        setError('Wypełnij wszystkie pola szablonu');
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
          ? `/api/email-templates/${editingTemplateId}`
          : '/api/email-templates';

        const method = editingTemplateId ? 'put' : 'post';

        const response = await apiClient[method](
          url,
          {
            name: templateName,
            subject: templateSubject,
            body: templateBody,
            category: templateCategory || 'General',
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
            placeholder="np. Raport miesięczny"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            required
          />

          <div>
            <label
              htmlFor="template-category"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kategoria
            </label>
            <select
              id="template-category"
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Wybierz kategorię...</option>
              {TEMPLATE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {templateCategory && (
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="w-full"
              >
                {generatingAI ? '🤖 Generowanie...' : '✨ Wygeneruj szablon AI'}
              </Button>
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                AI wygeneruje temat i treść na podstawie kategorii
              </p>
            </div>
          )}

          <Input
            label="Temat"
            placeholder="Temat emaila"
            value={templateSubject}
            onChange={(e) => setTemplateSubject(e.target.value)}
            required
          />

          <Textarea
            label="Treść"
            placeholder="Treść emaila..."
            rows={8}
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
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
                : 'Utwórz'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

TemplateModal.displayName = 'TemplateModal';
