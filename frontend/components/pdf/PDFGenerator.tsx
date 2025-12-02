import { memo } from 'react';
import { Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface PDFGeneratorProps {
  title: string;
  content: string;
  generating: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onGenerate: () => void;
  onPreview: () => void;
}

export const PDFGenerator = memo<PDFGeneratorProps>(
  ({
    title,
    content,
    generating,
    onTitleChange,
    onContentChange,
    onGenerate,
    onPreview,
  }) => {
    const isValid = title && content;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Nowy dokument PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Tytuł dokumentu"
            placeholder="Np. Faktura VAT #2024-001"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            aria-label="Tytuł dokumentu PDF"
          />

          <Textarea
            label="Treść dokumentu"
            placeholder="Wprowadź treść lub użyj AI do wygenerowania..."
            rows={14}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            required
            aria-label="Treść dokumentu PDF"
          />

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              disabled={!content}
              aria-label="Podgląd dokumentu"
            >
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
              Podgląd
            </Button>
            <Button
              onClick={onGenerate}
              disabled={generating || !isValid}
              aria-label="Generuj plik PDF"
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              {generating ? 'Generowanie...' : 'Generuj PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

PDFGenerator.displayName = 'PDFGenerator';
