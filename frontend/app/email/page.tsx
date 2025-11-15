'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Plus, Paperclip, X, FileText, Trash2, Edit, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getAccessToken, getCurrentUser } from '@/lib/auth';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  usage_count: number;
  is_favorite: boolean;
}

interface EmailAttachment {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
}

interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string;
  has_attachments: boolean;
  attachments_count: number;
}

export default function EmailPage() {
  const { showToast } = useToast();
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // Attachments
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // History
  const [emailHistory, setEmailHistory] = useState<SentEmail[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/email-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        showToast('Sesja wygasła, zaloguj się ponownie', 'error');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }, [showToast]);

  const fetchEmailHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const token = await getAccessToken();
      if (!token) {
        console.error('No auth token found');
        setLoadingHistory(false);
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/email/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        showToast('Sesja wygasła, zaloguj się ponownie', 'error');
        setLoadingHistory(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        setEmailHistory(Array.isArray(data) ? data : []);
      } else {
        setEmailHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch email history:', error);
      setEmailHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [showToast]);

  // Fetch templates on mount
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Zaloguj się aby korzystać z funkcji Email', 'error');
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      fetchTemplates();
      fetchEmailHistory();
    };
    checkAuth();
  }, [fetchTemplates, fetchEmailHistory, showToast]);

  const handleSendEmail = async () => {
    if (!recipient || !subject || !body) {
      showToast('Wypełnij wszystkie wymagane pola', 'error');
      return;
    }

    try {
      setSending(true);
      const token = await getAccessToken();
      
      const response = await fetch('http://localhost:3001/api/email/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: recipient,
          subject,
          body,
          attachments: attachments.map(a => ({ filename: a.filename, path: a.file_path }))
        })
      });

      if (response.ok) {
        showToast('Email wysłany pomyślnie!', 'success');
        setRecipient('');
        setSubject('');
        setBody('');
        setAttachments([]);
        fetchEmailHistory();
      } else {
        const error = await response.json();
        showToast(error.error || 'Błąd podczas wysyłania emaila', 'error');
      }
    } catch (error) {
      console.error('Send email error:', error);
      showToast('Błąd podczas wysyłania emaila', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Plik jest za duży (max 10MB)', 'error');
      return;
    }

    try {
      setUploading(true);
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('attachment', file);

      const response = await fetch('http://localhost:3001/api/email-templates/upload-attachment', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAttachments([...attachments, data.attachment]);
        showToast('Załącznik dodany pomyślnie', 'success');
      } else {
        showToast('Błąd podczas przesyłania załącznika', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Błąd podczas przesyłania załącznika', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUseTemplate = async (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    showToast(`Szablon "${template.name}" zastosowany`, 'success');

    // Increment usage count
    try {
      const token = await getAccessToken();
      await fetch(`http://localhost:3001/api/email-templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to update template usage:', error);
    }
  };

  const handleGenerateAITemplate = async () => {
    if (!templateCategory) {
      showToast('Wybierz kategorię przed generowaniem', 'error');
      return;
    }

    try {
      setGeneratingAI(true);
      const token = await getAccessToken();
      
      if (!token) {
        showToast('Brak autoryzacji, zaloguj się ponownie', 'error');
        setGeneratingAI(false);
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/email-templates/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: templateCategory,
          context: templateName // Use template name as additional context
        })
      });

      if (response.status === 401) {
        showToast('Sesja wygasła, zaloguj się ponownie', 'error');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setTemplateSubject(data.subject);
        setTemplateBody(data.body);
        showToast('Szablon wygenerowany przez AI!', 'success');
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(error.error || 'Błąd podczas generowania szablonu', 'error');
      }
    } catch (error) {
      console.error('Generate AI template error:', error);
      showToast('Błąd podczas generowania szablonu', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateSubject || !templateBody) {
      showToast('Wypełnij wszystkie pola szablonu', 'error');
      return;
    }

    try {
      const token = await getAccessToken();
      const url = editingTemplate 
        ? `http://localhost:3001/api/email-templates/${editingTemplate.id}`
        : 'http://localhost:3001/api/email-templates';
      
      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateName,
          subject: templateSubject,
          body: templateBody,
          category: templateCategory || 'General'
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
      const response = await fetch(`http://localhost:3001/api/email-templates/${id}`, {
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

  const openTemplateModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateSubject(template.subject);
      setTemplateBody(template.body);
      setTemplateCategory(template.category);
    } else {
      resetTemplateForm();
    }
    setShowTemplateModal(true);
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateSubject('');
    setTemplateBody('');
    setTemplateCategory('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Wymagane logowanie
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aby korzystać z funkcji wysyłania emaili, musisz być zalogowany.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email Composer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nowy Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Odbiorca"
                placeholder="email@example.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <Input
                label="Temat"
                placeholder="Wpisz temat wiadomości"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                label="Treść"
                placeholder="Napisz swoją wiadomość..."
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              
              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Załączniki:</p>
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{attachment.filename}</span>
                        <span className="text-xs text-gray-400">({formatFileSize(attachment.file_size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachments(attachments.filter(a => a.id !== attachment.id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="attachment-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={uploading}
                    onClick={() => document.getElementById('attachment-upload')?.click()}
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    {uploading ? 'Przesyłanie...' : 'Dodaj załącznik'}
                  </Button>
                </div>
                <Button onClick={handleSendEmail} disabled={sending}>
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? 'Wysyłanie...' : 'Wyślij teraz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
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
                        <Mail className="h-4 w-4 text-gray-500" />
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

          {/* Email History */}
          <Card>
            <CardHeader>
              <CardTitle>Ostatnie emaile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingHistory ? (
                <p className="text-sm text-gray-500 text-center py-4">Ładowanie...</p>
              ) : !Array.isArray(emailHistory) || emailHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Brak historii</p>
              ) : (
                emailHistory.slice(0, 5).map((email) => (
                  <div
                    key={email.id}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {email.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {email.recipient}
                        </p>
                        {email.has_attachments && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Paperclip className="h-3 w-3" />
                            {email.attachments_count} załącznik(i)
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={email.status === 'sent' ? 'success' : 'danger'}
                      >
                        {email.status === 'sent' ? 'Wysłane' : 'Błąd'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(email.sent_at)}
                    </p>
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
            placeholder="np. Raport miesięczny"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategoria
            </label>
            <select
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Wybierz kategorię...</option>
              <option value="Oferta handlowa">Oferta handlowa</option>
              <option value="Raport">Raport</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Przypomnienie">Przypomnienie</option>
              <option value="Zaproszenie">Zaproszenie</option>
              <option value="Podziękowanie">Podziękowanie</option>
              <option value="Informacja">Informacja</option>
              <option value="Newsletter">Newsletter</option>
              <option value="Faktura">Faktura</option>
              <option value="Potwierdzenie">Potwierdzenie</option>
            </select>
          </div>

          {templateCategory && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAITemplate}
                disabled={generatingAI}
                className="w-full"
              >
                {generatingAI ? '🤖 Generowanie...' : '✨ Wygeneruj szablon AI'}
              </Button>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                AI wygeneruje temat i treść na podstawie kategorii
              </p>
            </div>
          )}

          <Input
            label="Temat"
            placeholder="Temat emaila"
            value={templateSubject}
            onChange={(e) => setTemplateSubject(e.target.value)}
          />
          <Textarea
            label="Treść"
            placeholder="Treść emaila..."
            rows={8}
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
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
              {editingTemplate ? 'Zaktualizuj' : 'Utwórz'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
