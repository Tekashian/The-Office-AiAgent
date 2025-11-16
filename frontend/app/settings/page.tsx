'use client';

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Database, Save, RotateCcw, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

interface UserContext {
  full_name?: string;
  company?: string;
  job_title?: string;
  department?: string;
  work_description?: string;
  company_description?: string;
  ai_context_notes?: string;
  email_signature?: string;
  preferences?: {
    communication_tone: string;
    language: string;
    email_priority: string;
    auto_response: boolean;
    working_hours: {
      start: string;
      end: string;
      timezone: string;
    };
    notification_preferences: {
      email: boolean;
      daily_summary: boolean;
      task_reminders: boolean;
    };
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [context, setContext] = useState<UserContext>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
    }
  };

  const fetchContext = async () => {
    try {
      const response = await apiClient.get('/api/user/context');
      setContext(response.data.context || {});
    } catch (error) {
      console.error('Failed to fetch context:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
    fetchContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/user/context', context);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      alert(`Błąd podczas zapisywania: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Czy na pewno chcesz zresetować wszystkie ustawienia do wartości domyślnych?')) return;
    
    setSaving(true);
    try {
      const response = await apiClient.post('/api/user/context/reset');
      setContext(response.data.context || {});
      alert('Ustawienia zostały zresetowane');
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      alert(`Błąd podczas resetowania: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ustawienia
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Zarządzaj konfiguracją aplikacji i preferencjami AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetuj
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>Zapisywanie...</>
            ) : showSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Zapisano!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Zapisz zmiany
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profil użytkownika */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle>Profil użytkownika</CardTitle>
            </div>
            <CardDescription>
              Podstawowe informacje o Tobie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input 
                label="Imię i nazwisko" 
                value={context.full_name || ''} 
                onChange={(e) => setContext(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Jan Kowalski"
              />
              <Input 
                label="Firma" 
                value={context.company || ''} 
                onChange={(e) => setContext(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nazwa Twojej firmy"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input 
                label="Stanowisko" 
                value={context.job_title || ''} 
                onChange={(e) => setContext(prev => ({ ...prev, job_title: e.target.value }))}
                placeholder="Marketing Manager"
              />
              <Input 
                label="Dział" 
                value={context.department || ''} 
                onChange={(e) => setContext(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Marketing"
              />
            </div>
          </CardContent>
        </Card>

        {/* Kontekst AI - Najważniejsza sekcja */}
        <Card className="border-2 border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-indigo-900 dark:text-indigo-100">Kontekst dla AI</CardTitle>
            </div>
            <CardDescription>
              Informacje te pomogą AI lepiej rozumieć Twoje potrzeby i generować trafniejsze odpowiedzi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opis Twojej pracy i obowiązków
              </label>
              <textarea
                value={context.work_description || ''}
                onChange={(e) => setContext(prev => ({ ...prev, work_description: e.target.value }))}
                placeholder="Np. Zarządzam kampaniami marketingowymi, tworzę raporty sprzedażowe, koordynuję zespół 5 osób, planuję budżet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                O Twojej firmie i branży
              </label>
              <textarea
                value={context.company_description || ''}
                onChange={(e) => setContext(prev => ({ ...prev, company_description: e.target.value }))}
                placeholder="Np. Zajmujemy się e-commerce w branży fashion, 50 pracowników, działamy na rynku polskim od 5 lat..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dodatkowe preferencje i notatki dla AI
              </label>
              <textarea
                value={context.ai_context_notes || ''}
                onChange={(e) => setContext(prev => ({ ...prev, ai_context_notes: e.target.value }))}
                placeholder="Np. Preferuję krótkie emaile, często używam emoji 📊 w raportach, lubię dane w tabelach, unikam zbyt formalnego tonu..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferowany ton komunikacji
              </label>
              <select
                value={context.preferences?.communication_tone || 'professional'}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    communication_tone: e.target.value
                  } as typeof prev.preferences
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="professional">Profesjonalny i formalny</option>
                <option value="friendly-professional">Przyjazny ale profesjonalny</option>
                <option value="casual">Swobodny i nieformalny</option>
                <option value="formal">Bardzo formalny</option>
                <option value="friendly">Przyjazny i ciepły</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Podpis Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle>Podpis Email</CardTitle>
            </div>
            <CardDescription>
              Automatyczny podpis dodawany do wysyłanych emaili. Użyj: {"{{name}}"}, {"{{company}}"}, {"{{position}}"}, {"{{email}}"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={context.email_signature || ''}
              onChange={(e) => setContext(prev => ({ ...prev, email_signature: e.target.value }))}
              placeholder={`Pozdrawiam,\n{{name}}\n{{position}}\n{{company}}\n📧 {{email}}\n📱 +48 123 456 789`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white font-mono text-sm"
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Powiadomienia */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle>Powiadomienia</CardTitle>
            </div>
            <CardDescription>
              Zarządzaj preferencjami powiadomień
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Email powiadomienia
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Otrzymuj powiadomienia na email
                </p>
              </div>
              <input
                type="checkbox"
                checked={context.preferences?.notification_preferences?.email || false}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    notification_preferences: {
                      ...prev.preferences?.notification_preferences,
                      email: e.target.checked
                    }
                  } as typeof prev.preferences
                }))}
                className="h-4 w-4 rounded"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Podsumowania dzienne
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Codzienne raporty aktywności
                </p>
              </div>
              <input
                type="checkbox"
                checked={context.preferences?.notification_preferences?.daily_summary || false}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    notification_preferences: {
                      ...prev.preferences?.notification_preferences,
                      daily_summary: e.target.checked
                    }
                  } as typeof prev.preferences
                }))}
                className="h-4 w-4 rounded"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Przypomnienia o zadaniach
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powiadomienia przed deadline
                </p>
              </div>
              <input
                type="checkbox"
                checked={context.preferences?.notification_preferences?.task_reminders || false}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    notification_preferences: {
                      ...prev.preferences?.notification_preferences,
                      task_reminders: e.target.checked
                    }
                  } as typeof prev.preferences
                }))}
                className="h-4 w-4 rounded"
              />
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
