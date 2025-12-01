import { memo, useEffect } from 'react';
import { Download, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { PDFFile } from '@/hooks/usePDF';

interface PDFListProps {
  files: PDFFile[];
  loading: boolean;
  highlightId: string | null;
  maxItems?: number;
  onDownload: (pdf: PDFFile) => void;
  onDelete: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const PDFList = memo<PDFListProps>(
  ({ files, loading, highlightId, maxItems = 5, onDownload, onDelete }) => {
    const displayFiles = files.slice(0, maxItems);

    // Scroll to highlighted PDF
    useEffect(() => {
      if (highlightId && files.length > 0 && !loading) {
        setTimeout(() => {
          const element = document.getElementById(`pdf-${highlightId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add(
              'ring-4',
              'ring-indigo-500',
              'ring-offset-2'
            );
            setTimeout(() => {
              element.classList.remove(
                'ring-4',
                'ring-indigo-500',
                'ring-offset-2'
              );
            }, 3000);
          }
        }, 300);
      }
    }, [highlightId, files, loading]);

    const handleDelete = (id: string, title: string) => {
      if (confirm(`Czy na pewno chcesz usunąć plik "${title}"?`)) {
        onDelete(id);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ładowanie...
              </p>
            </div>
          ) : files.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Brak plików PDF
              </p>
            </div>
          ) : (
            displayFiles.map((pdf) => (
              <article
                key={pdf.id}
                id={`pdf-${pdf.id}`}
                className="rounded-lg border border-gray-200 p-3 transition-all duration-300 hover:shadow-md dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {pdf.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(pdf.file_size)}
                    </p>
                  </div>
                  <Badge variant="success" aria-label="Plik gotowy do pobrania">
                    Gotowe
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <time
                    className="text-xs text-gray-400"
                    dateTime={pdf.created_at}
                  >
                    {formatDate(pdf.created_at)}
                  </time>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(pdf)}
                      aria-label={`Pobierz ${pdf.title}`}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pdf.id, pdf.title)}
                      aria-label={`Usuń ${pdf.title}`}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    );
  }
);

PDFList.displayName = 'PDFList';
