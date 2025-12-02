'use client';

import React, { useState } from 'react';
import { usePDFRefresh } from '@/context/pdfRefreshContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { usePDF, type PDFTemplate, type PDFFile } from '@/hooks/usePDF';
import { PDFGenerator } from '@/components/pdf/PDFGenerator';
import { PDFTemplates } from '@/components/pdf/PDFTemplates';
import { PDFList } from '@/components/pdf/PDFList';
import { PDFTemplateModal } from '@/components/pdf/PDFTemplateModal';
import { PDFPreviewModal } from '@/components/pdf/PDFPreviewModal';

export default function PDFPage() {
  const { refreshKey } = usePDFRefresh();
  const { showToast } = useToast();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const {
    title,
    content,
    generating,
    isAuthenticated,
    highlightId,
    templates,
    pdfFiles,
    loadingFiles,
    setTitle,
    setContent,
    generatePDF,
    downloadPDF,
    deletePDF,
    useTemplate,
    deleteTemplate,
    refreshTemplates,
  } = usePDF({ refreshKey });

  const handleGeneratePDF = async () => {
    const success = await generatePDF();
    if (success) {
      showToast('PDF wygenerowany pomyślnie!', 'success');
    }
  };

  const handleDownloadPDF = async (pdf: PDFFile) => {
    await downloadPDF(pdf);
  };

  const handleDeletePDF = async (id: string) => {
    await deletePDF(id);
    showToast('PDF usunięty', 'success');
  };

  const handleUseTemplate = async (template: PDFTemplate) => {
    await useTemplate(template);
    showToast(`Użyto szablonu: ${template.name}`, 'success');
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    showToast('Szablon usunięty', 'success');
  };

  const handleEditTemplate = (template: PDFTemplate) => {
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
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mb-4 text-6xl">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Wymagane logowanie
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Zaloguj się aby korzystać z generatora PDF
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
          PDF Generator
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Generuj profesjonalne dokumenty PDF
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* PDF Generator */}
        <div className="lg:col-span-2">
          <PDFGenerator
            title={title}
            content={content}
            generating={generating}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onGenerate={handleGeneratePDF}
            onPreview={() => setShowPreviewModal(true)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PDFTemplates
            templates={templates}
            onUseTemplate={handleUseTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onCreateNew={handleCreateTemplate}
          />

          <PDFList
            files={pdfFiles}
            loading={loadingFiles}
            highlightId={highlightId}
            maxItems={5}
            onDownload={handleDownloadPDF}
            onDelete={handleDeletePDF}
          />
        </div>
      </div>

      {/* Template Modal */}
      <PDFTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSave={handleTemplateSaved}
        editingTemplateId={editingTemplateId}
        templates={templates}
      />

      {/* Preview Modal */}
      <PDFPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onGenerate={handleGeneratePDF}
        title={title}
        content={content}
        generating={generating}
      />
    </div>
  );
}
