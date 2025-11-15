'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Inbox,
  Star,
  Archive,
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

interface InboxEmail {
  id: string;
  message_id: string;
  from_address: string;
  from_name: string;
  subject: string;
  body_text: string;
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  ai_priority: 'urgent' | 'high' | 'normal' | 'low';
  ai_category: string;
  ai_sentiment: string;
  ai_summary: string;
  ai_suggested_action: string;
}

interface AIDraft {
  id: string;
  inbox_email_id: string;
  to_address: string;
  subject: string;
  body: string;
  edited_body: string;
  user_edited: boolean;
  ai_confidence: number;
  ai_reasoning: string;
  tone: string;
  status: 'pending' | 'edited' | 'approved' | 'rejected' | 'sent';
  inbox_email?: {
    from_address: string;
    subject: string;
  };
}

export default function EmailInboxPage() {
  const [user, setUser] = useState<any>(null);
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<AIDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({ unread: 0, urgent: 0, pending_drafts: 0 });
  const [editingDraft, setEditingDraft] = useState(false);
  const [editedBody, setEditedBody] = useState('');
  const [showImapModal, setShowImapModal] = useState(false);
  const [imapForm, setImapForm] = useState({
    imap_user: '',
    imap_password: '',
  });
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    await loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📧 Loading email inbox data...');
      const [emailsRes, draftsRes, statsRes] = await Promise.all([
        apiClient.get('/api/email-inbox/emails?limit=50'),
        apiClient.get('/api/email-inbox/drafts?status=pending'),
        apiClient.get('/api/email-inbox/stats'),
      ]);

      setEmails(emailsRes.data.emails || []);
      setDrafts(draftsRes.data.drafts || []);
      setStats(statsRes.data);
      console.log('✅ Email inbox loaded successfully');
    } catch (error: any) {
      console.error('❌ Email inbox error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanInbox = async () => {
    try {
      setScanning(true);
      const response = await apiClient.post('/api/email-inbox/scan');
      alert(`Inbox scanned! Found ${response.data.emailsFound} new emails.`);
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Scan failed';
      if (errorMsg.includes('No active IMAP configuration')) {
        alert(`⚠️ IMAP Not Configured!\n\n` +
          `To scan your inbox, you need to configure IMAP:\n\n` +
          `1. Gmail: imap.gmail.com (port 993)\n` +
          `2. Generate App Password: myaccount.google.com/apppasswords\n` +
          `3. Click "Configure IMAP" button below\n\n` +
          `Full guide: Check EMAIL_INBOX_GUIDE.md file`);
      } else {
        alert(errorMsg);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleSelectEmail = async (email: InboxEmail) => {
    setSelectedEmail(email);
    
    // Mark as read
    if (!email.is_read) {
      await apiClient.patch(`/api/email-inbox/emails/${email.id}`, { is_read: true });
      setEmails(emails.map(e => e.id === email.id ? { ...e, is_read: true } : e));
    }

    // Load draft if exists
    try {
      const response = await apiClient.get(`/api/email-inbox/emails/${email.id}`);
      if (response.data.draft) {
        setSelectedDraft(response.data.draft);
        setEditedBody(response.data.draft.edited_body || response.data.draft.body);
      } else {
        setSelectedDraft(null);
      }
    } catch (error) {
      console.error('Load draft error:', error);
    }
  };

  const handleEditDraft = () => {
    setEditingDraft(true);
    setEditedBody(selectedDraft?.edited_body || selectedDraft?.body || '');
  };

  const handleSaveDraft = async () => {
    if (!selectedDraft) return;

    try {
      await apiClient.patch(`/api/email-inbox/drafts/${selectedDraft.id}`, {
        edited_body: editedBody,
        status: 'edited',
      });
      setSelectedDraft({ ...selectedDraft, edited_body: editedBody, user_edited: true, status: 'edited' });
      setEditingDraft(false);
      alert('Draft saved!');
    } catch (error) {
      alert('Failed to save draft');
    }
  };

  const handleSendDraft = async () => {
    if (!selectedDraft) return;

    if (!confirm('Send this email?')) return;

    try {
      await apiClient.post(`/api/email-inbox/drafts/${selectedDraft.id}/send`);
      alert('Email sent successfully!');
      setSelectedDraft({ ...selectedDraft, status: 'sent' });
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Send failed');
    }
  };

  const handleRejectDraft = async () => {
    if (!selectedDraft) return;

    try {
      await apiClient.patch(`/api/email-inbox/drafts/${selectedDraft.id}`, { status: 'rejected' });
      setSelectedDraft({ ...selectedDraft, status: 'rejected' });
      await loadData();
    } catch (error) {
      alert('Failed to reject draft');
    }
  };

  const handleSaveImapConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim whitespace from email and password
    const trimmedEmail = imapForm.imap_user.trim();
    const trimmedPassword = imapForm.imap_password.trim();
    
    console.log('🔧 Saving IMAP configuration...');
    console.log('📧 Email:', trimmedEmail);
    console.log('🔐 Password length:', trimmedPassword.length);
    
    try {
      console.log('📡 Sending POST request to /api/email-inbox/imap-config');
      const response = await apiClient.post('/api/email-inbox/imap-config', {
        config_name: 'My Gmail',
        imap_host: 'imap.gmail.com',
        imap_port: 993,
        imap_user: trimmedEmail,
        imap_password: trimmedPassword,
        use_ssl: true,
      });
      console.log('✅ IMAP config saved successfully:', response.data);
      alert('✅ IMAP configured successfully!');
      setShowImapModal(false);
      setImapForm({ imap_user: '', imap_password: '' });
    } catch (err: any) {
      console.error('❌ IMAP configuration failed:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      alert('❌ Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📬 AI Email Inbox
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-powered inbox with automatic draft responses
          </p>
        </div>
        <Button onClick={handleScanInbox} disabled={scanning} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan Inbox'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.unread}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.urgent}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Drafts</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.pending_drafts}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Inbox ({emails.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''
                  } ${!email.is_read ? 'font-semibold' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {email.from_name || email.from_address}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                        {email.ai_summary}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <Badge className={`text-xs ${getPriorityColor(email.ai_priority)}`}>
                        {email.ai_priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {!email.is_read && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(email.received_at).toLocaleString('pl-PL')}
                    </span>
                  </div>
                </div>
              ))}

              {emails.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">No emails yet.</p>
                  <p className="text-sm mb-4">Configure IMAP to start scanning your inbox.</p>
                  <Button 
                    onClick={() => setShowImapModal(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    ⚙️ Configure IMAP
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Detail & AI Draft */}
        <Card className="lg:col-span-2">
          {selectedEmail ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{selectedEmail.subject}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      From: {selectedEmail.from_name || selectedEmail.from_address}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(selectedEmail.received_at).toLocaleString('pl-PL')}
                    </p>
                  </div>
                  <Badge className={getPriorityColor(selectedEmail.ai_priority)}>
                    {selectedEmail.ai_priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Original Email */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Original Email:
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedEmail.body_text.substring(0, 1000)}
                    {selectedEmail.body_text.length > 1000 && '...'}
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      AI Analysis
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Summary:</span>
                      <span className="text-gray-900 dark:text-white">{selectedEmail.ai_summary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <Badge variant="default">{selectedEmail.ai_category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Sentiment:</span>
                      <Badge variant="info">{selectedEmail.ai_sentiment}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Suggested Action:</span>
                      <Badge variant="success">{selectedEmail.ai_suggested_action}</Badge>
                    </div>
                  </div>
                </div>

                {/* AI Draft Response */}
                {selectedDraft && selectedDraft.status !== 'sent' && (
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          AI Generated Response
                        </h3>
                        <Badge variant="info" className="text-xs">
                          {(selectedDraft.ai_confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      {!editingDraft && (
                        <Button variant="ghost" size="sm" onClick={handleEditDraft}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">To:</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedDraft.to_address}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">Subject:</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedDraft.subject}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Body:</label>
                        {editingDraft ? (
                          <textarea
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            rows={10}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {selectedDraft.edited_body || selectedDraft.body}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                        {editingDraft ? (
                          <>
                            <Button variant="ghost" onClick={() => setEditingDraft(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveDraft}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Save Draft
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" onClick={handleRejectDraft}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button onClick={handleSendDraft} className="bg-green-600 hover:bg-green-700">
                              <Send className="h-4 w-4 mr-2" />
                              Send Email
                            </Button>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        💡 {selectedDraft.ai_reasoning}
                      </p>
                    </div>
                  </div>
                )}

                {selectedDraft && selectedDraft.status === 'sent' && (
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-400">
                      Email sent successfully!
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <Mail className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400">
                Select an email to view details and AI-generated response
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* IMAP Configuration Modal */}
      <Modal isOpen={showImapModal} onClose={() => setShowImapModal(false)} title="Configure IMAP">
        <form onSubmit={handleSaveImapConfig} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">📧 Gmail Setup:</p>
            <ol className="list-decimal list-inside text-blue-800 dark:text-blue-400 space-y-1 text-xs">
              <li>Go to: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">myaccount.google.com/apppasswords</a></li>
              <li>Generate new app password</li>
              <li>Copy the 16-character password</li>
              <li>Paste it below</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gmail Address
            </label>
            <input
              type="email"
              required
              value={imapForm.imap_user}
              onChange={(e) => setImapForm({ ...imapForm, imap_user: e.target.value })}
              placeholder="your.email@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              App Password (16 characters)
            </label>
            <input
              type="password"
              required
              value={imapForm.imap_password}
              onChange={(e) => setImapForm({ ...imapForm, imap_password: e.target.value })}
              placeholder="xxxx xxxx xxxx xxxx"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowImapModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Configuration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
