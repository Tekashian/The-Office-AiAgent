'use client';

import React, { useState } from 'react';
import { Mail, Send, Plus, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

export default function EmailPage() {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const recentEmails = [
    {
      id: '1',
      to: 'zespol@firma.pl',
      subject: 'Raport miesięczny',
      status: 'sent',
      date: '2024-11-14 10:30',
    },
    {
      id: '2',
      to: 'klient@example.com',
      subject: 'Oferta handlowa',
      status: 'scheduled',
      date: '2024-11-15 09:00',
    },
  ];

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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nowy Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Odbiorcy"
                placeholder="email@example.com, email2@example.com"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
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
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Dodaj załącznik
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Zaplanuj
                  </Button>
                  <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Wyślij teraz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Szybkie akcje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Szablon raportu
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Szablon oferty
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Nowy szablon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ostatnie emaile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEmails.map((email) => (
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
                        {email.to}
                      </p>
                    </div>
                    <Badge
                      variant={email.status === 'sent' ? 'success' : 'warning'}
                    >
                      {email.status === 'sent' ? 'Wysłane' : 'Zaplanowane'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {email.date}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
