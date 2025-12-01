import { memo } from 'react';
import { FileText, Plus, Edit, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { PDFTemplate } from '@/hooks/usePDF';

interface PDFTemplatesProps {
  templates: PDFTemplate[];
  onUseTemplate: (template: PDFTemplate) => void;
  onEditTemplate: (template: PDFTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateNew: () => void;
}

export const PDFTemplates = memo<PDFTemplatesProps>(
  ({
    templates,
    onUseTemplate,
    onEditTemplate,
    onDeleteTemplate,
    onCreateNew,
  }) => {
    const handleDelete = (id: string, name: string) => {
      if (confirm(`Czy na pewno chcesz usunąć szablon "${name}"?`)) {
        onDeleteTemplate(id);
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Szablony</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNew}
            aria-label="Utwórz nowy szablon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Brak szablonów
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateNew}
                className="mt-4"
              >
                Utwórz pierwszy szablon
              </Button>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <button
                  onClick={() => onUseTemplate(template)}
                  className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  aria-label={`Użyj szablonu ${template.name}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText
                      className="h-4 w-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </span>
                    {template.is_favorite && (
                      <Star
                        className="h-3 w-3 fill-yellow-500 text-yellow-500"
                        aria-label="Ulubiony"
                      />
                    )}
                  </div>
                  <p className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                    {template.category} • Użyto {template.usage_count}x
                  </p>
                </button>

                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTemplate(template)}
                    aria-label={`Edytuj szablon ${template.name}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id, template.name)}
                    aria-label={`Usuń szablon ${template.name}`}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }
);

PDFTemplates.displayName = 'PDFTemplates';
