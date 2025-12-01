import { memo } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { EmailAttachment } from '@/hooks/useEmail';

interface EmailComposerProps {
  recipient: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  sending: boolean;
  uploading: boolean;
  onRecipientChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const EmailComposer = memo<EmailComposerProps>(
  ({
    recipient,
    subject,
    body,
    attachments,
    sending,
    uploading,
    onRecipientChange,
    onSubjectChange,
    onBodyChange,
    onSend,
    onFileUpload,
    onRemoveAttachment,
  }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
        e.target.value = ''; // Reset input
      }
    };

    const isValid = recipient && subject && body;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Nowy Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Odbiorca"
            placeholder="email@example.com"
            value={recipient}
            onChange={(e) => onRecipientChange(e.target.value)}
            type="email"
            required
            aria-label="Adres email odbiorcy"
          />

          <Input
            label="Temat"
            placeholder="Wpisz temat wiadomości"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            required
            aria-label="Temat wiadomości"
          />

          <Textarea
            label="Treść"
            placeholder="Napisz swoją wiadomość..."
            rows={10}
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            required
            aria-label="Treść wiadomości"
          />

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Załączniki:
              </p>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <FileText
                        className="h-5 w-5 text-primary-500"
                        aria-hidden="true"
                      />
                      <div>
                        <span className="text-sm font-medium">
                          {attachment.filename}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({formatFileSize(attachment.file_size)})
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveAttachment(attachment.id)}
                      aria-label={`Usuń załącznik ${attachment.filename}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <input
                type="file"
                id="attachment-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                disabled={uploading}
                aria-label="Prześlij załącznik"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById('attachment-upload')?.click()}
              >
                <Paperclip className="mr-2 h-4 w-4" aria-hidden="true" />
                {uploading ? 'Przesyłanie...' : 'Dodaj załącznik'}
              </Button>
            </div>

            <Button onClick={onSend} disabled={!isValid || sending}>
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              {sending ? 'Wysyłanie...' : 'Wyślij teraz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

EmailComposer.displayName = 'EmailComposer';
