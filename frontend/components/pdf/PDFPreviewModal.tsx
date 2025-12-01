import { memo } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  title: string;
  content: string;
  generating: boolean;
}

export const PDFPreviewModal = memo<PDFPreviewModalProps>(
  ({ isOpen, onClose, onGenerate, title, content, generating }) => {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Podgląd: ${title || 'Dokument PDF'}`}
      >
        <div className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h2 className="mb-4 text-center text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <div className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300">
                {content}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Zamknij
            </Button>
            <Button
              onClick={() => {
                onClose();
                onGenerate();
              }}
              disabled={generating}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Generuj PDF
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

PDFPreviewModal.displayName = 'PDFPreviewModal';
