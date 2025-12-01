'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useEmail, type EmailTemplate } from '@/hooks/useEmail';
import { EmailComposer } from '@/components/email/EmailComposer';
import { EmailTemplates } from '@/components/email/EmailTemplates';
import { EmailHistory } from '@/components/email/EmailHistory';
import { EmailError } from '@/components/email/EmailError';
import { TemplateModal } from '@/components/email/TemplateModal';

export default function EmailPage() {
  const { showToast } = useToast();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const {
    recipient,
    subject,
    body,
    attachments,
    sending,
    uploading,
    isAuthenticated,
    error,
    templates,
    emailHistory,
    loadingHistory,
    setRecipient,
    setSubject,
    setBody,
    sendEmail,
    uploadAttachment,
    removeAttachment,
    useTemplate,
    deleteTemplate,
    refreshTemplates,
    clearError,
  } = useEmail();

  const handleSendEmail = async () => {
    const success = await sendEmail();
    if (success) {
      showToast('Email wysłany pomyślnie!', 'success');
    }
  };

  const handleFileUpload = async (file: File) => {
    const success = await uploadAttachment(file);
    if (success) {
      showToast('Załącznik dodany pomyślnie', 'success');
    }
  };

  const handleUseTemplate = async (template: EmailTemplate) => {
    await useTemplate(template);
    showToast(`Szablon "${template.name}" zastosowany`, 'success');
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    showToast('Szablon usunięty', 'success');
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplateId(template.id);
    setShowTemplateModal(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplateId(null);
    setShowTemplateModal(true);
  };

  const handleTemplateSaved = () => {
    refreshTemplates();
    showToast(
      editingTemplateId ? 'Szablon zaktualizowany' : 'Szablon utworzony',
      'success'
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Email Automation
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Automatyzuj wysyłkę emaili i zarządzaj komunikacją
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mb-4 text-6xl">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Wymagane logowanie
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aby korzystać z funkcji wysyłania emaili, musisz być zalogowany.
              </p>
              <Button onClick={() => (window.location.href = '/auth')}>
                Przejdź do logowania
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Email Automation
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Automatyzuj wysyłkę emaili i zarządzaj komunikacją
        </p>
      </div>

      {error && <EmailError message={error} onDismiss={clearError} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email Composer */}
        <div className="lg:col-span-2">
          <EmailComposer
            recipient={recipient}
            subject={subject}
            body={body}
            attachments={attachments}
            sending={sending}
            uploading={uploading}
            onRecipientChange={setRecipient}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            onSend={handleSendEmail}
            onFileUpload={handleFileUpload}
            onRemoveAttachment={removeAttachment}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EmailTemplates
            templates={templates}
            onUseTemplate={handleUseTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onCreateNew={handleCreateTemplate}
          />

          <EmailHistory
            emails={emailHistory}
            loading={loadingHistory}
            maxItems={5}
          />
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSave={handleTemplateSaved}
        editingTemplateId={editingTemplateId}
        templates={templates}
      />
    </div>
  );
}
