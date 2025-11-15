'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Plus, Eye, Trash2, Edit, Star, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getAccessToken, getCurrentUser } from '@/lib/auth';

interface PDFTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  usage_count: number;
  is_favorite: boolean;
}

interface PDFFile {
  id: string;
  filename: string;
  title: string;
  file_size: number;
  created_at: string;
  downloadUrl: string;
}

export default function PDFPage() {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // Templates
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PDFTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  
  // PDF Files
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const categories = [
    'Faktura VAT',
    'Oferta handlowa',
    'Umowa',
    'Raport miesięczny',
    'Notatka',
    'Protokół',
    'Specyfikacja',
    'Potwierdzenie',
    'Inne'
  ];

  const fetchTemplates = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token found for PDF templates');
        setTemplates([]);
        return;
      }
      
      console.log('🔄 Fetching PDF templates...');
      const response = await fetch('http://localhost:3001/api/pdf/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ PDF Templates fetched:', data);
        setTemplates(Array.isArray(data) ? data : []);
      } else {
        console.error('❌ PDF Templates fetch failed:', response.status);
        setTemplates([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch PDF templates:', error);
      setTemplates([]);
    }
  }, []);

  const fetchPDFFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token found for PDF files');
        setPdfFiles([]);
        setLoadingFiles(false);
        return;
      }
      
      console.log('🔄 Fetching PDF files...');
      const response = await fetch('http://localhost:3001/api/pdf/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ PDF files fetched:', data);
        setPdfFiles(data.pdfs || []);
      } else {
        console.error('❌ PDF files fetch failed:', response.status);
        setPdfFiles([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch PDF files:', error);
      setPdfFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Zaloguj się aby korzystać z funkcji PDF', 'error');
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      fetchTemplates();
      fetchPDFFiles();
    };
    checkAuth();
  }, [fetchTemplates, fetchPDFFiles, showToast]);

  const handleGenerateAIContent = async () => {
    if (!templateCategory) {
      showToast('Wybierz kategorię przed generowaniem', 'error');
      return;
    }

    try {
      setGeneratingAI(true);
      const token = await getAccessToken();
      
      if (!token) {
        showToast('Brak autoryzacji, zaloguj się ponownie', 'error');
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/pdf/templates/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: templateCategory,
          context: templateName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateContent(data.content);
        showToast('Treść wygenerowana przez AI!', 'success');
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(error.error || 'Błąd podczas generowania treści', 'error');
      }
    } catch (error) {
      console.error('Generate AI content error:', error);
      showToast('Błąd podczas generowania treści', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateContent) {
      showToast('Wypełnij nazwę i treść szablonu', 'error');
      return;
    }

    try {
      const token = await getAccessToken();
      const url = editingTemplate 
        ? `http://localhost:3001/api/pdf/templates/${editingTemplate.id}`
        : 'http://localhost:3001/api/pdf/templates';
      
      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateName,
          content: templateContent,
          category: templateCategory || 'Inne'
        })
      });

      if (response.ok) {
        showToast(editingTemplate ? 'Szablon zaktualizowany' : 'Szablon utworzony', 'success');
        setShowTemplateModal(false);
        resetTemplateForm();
        fetchTemplates();
      } else {
        showToast('Błąd podczas zapisywania szablonu', 'error');
      }
    } catch (error) {
      console.error('Save template error:', error);
      showToast('Błąd podczas zapisywania szablonu', 'error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:3001/api/pdf/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Szablon usunięty', 'success');
        fetchTemplates();
      } else {
        showToast('Błąd podczas usuwania szablonu', 'error');
      }
    } catch (error) {
      console.error('Delete template error:', error);
      showToast('Błąd podczas usuwania szablonu', 'error');
    }
  };

  const handleUseTemplate = async (template: PDFTemplate) => {
    setTitle(template.name);
    setContent(template.content);
    showToast(`Użyto szablonu: ${template.name}`, 'success');
    
    try {
      const token = await getAccessToken();
      await fetch(`http://localhost:3001/api/pdf/templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to update template usage:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!title || !content) {
      showToast('Wypełnij tytuł i treść dokumentu', 'error');
      return;
    }

    try {
      setGenerating(true);
      const token = await getAccessToken();
      
      const response = await fetch('http://localhost:3001/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          filename: title
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast('PDF wygenerowany pomyślnie!', 'success');
        setTitle('');
        setContent('');
        fetchPDFFiles();
        
        // Auto download
        const downloadUrl = `http://localhost:3001${data.pdf.downloadUrl}`;
        const downloadResponse = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.pdf.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        showToast(error.error || 'Błąd podczas generowania PDF', 'error');
      }
    } catch (error) {
      console.error('Generate PDF error:', error);
      showToast('Błąd podczas generowania PDF', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (pdf: PDFFile) => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:3001${pdf.downloadUrl}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download PDF error:', error);
      showToast('Błąd podczas pobierania PDF', 'error');
    }
  };

  const handleDeletePDF = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten plik PDF?')) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:3001/api/pdf/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('PDF usunięty', 'success');
        fetchPDFFiles();
      } else {
        showToast('Błąd podczas usuwania PDF', 'error');
      }
    } catch (error) {
      console.error('Delete PDF error:', error);
      showToast('Błąd podczas usuwania PDF', 'error');
    }
  };

  const openTemplateModal = (template?: PDFTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateContent(template.content);
      setTemplateCategory(template.category);
    } else {
      resetTemplateForm();
    }
    setShowTemplateModal(true);
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateContent('');
    setTemplateCategory('');
  };

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
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Zaloguj się aby korzystać z generatora PDF</p>
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nowy dokument PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Tytuł dokumentu"
                placeholder="Np. Faktura VAT #2024-001"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Textarea
                label="Treść dokumentu"
                placeholder="Wprowadź treść lub użyj AI do wygenerowania..."
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="flex items-center justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (content) {
                      alert(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
                    }
                  }}
                  disabled={!content}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Podgląd
                </Button>
                <Button 
                  onClick={handleGeneratePDF} 
                  disabled={generating || !title || !content}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {generating ? 'Generowanie...' : 'Generuj PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Szablony</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => openTemplateModal()}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Brak szablonów</p>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="group flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{template.name}</span>
                        {template.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-xs text-gray-400 ml-6">
                        {template.category} • Użyto {template.usage_count}x
                      </p>
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTemplateModal(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent PDFs */}
          <Card>
            <CardHeader>
              <CardTitle>Ostatnie PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingFiles ? (
                <p className="text-sm text-gray-500 text-center py-4">Ładowanie...</p>
              ) : pdfFiles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Brak plików</p>
              ) : (
                pdfFiles.slice(0, 5).map((pdf) => (
                  <div
                    key={pdf.id}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {pdf.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(pdf.file_size)}
                        </p>
                      </div>
                      <Badge variant="success">Gotowe</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-400">{formatDate(pdf.created_at)}</p>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadPDF(pdf)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePDF(pdf.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          resetTemplateForm();
        }}
        title={editingTemplate ? 'Edytuj szablon' : 'Nowy szablon'}
      >
        <div className="space-y-4">
          <Input
            label="Nazwa szablonu"
            placeholder="Np. Faktura standardowa"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kategoria
            </label>
            <select 
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
            >
              <option value="">Wybierz kategorię</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
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
              onClick={handleGenerateAIContent}
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
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTemplateModal(false);
                resetTemplateForm();
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Zaktualizuj' : 'Utwórz'} szablon
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
