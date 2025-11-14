'use client';

import React, { useState } from 'react';
import { FileText, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

export default function PDFPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const recentPDFs = [
    {
      id: '1',
      name: 'Faktura_2024_001.pdf',
      size: '245 KB',
      date: '2024-11-14 11:20',
      status: 'completed',
    },
    {
      id: '2',
      name: 'Raport_Sprzedaz_Q4.pdf',
      size: '1.2 MB',
      date: '2024-11-13 15:45',
      status: 'completed',
    },
  ];

  const templates = [
    { id: '1', name: 'Faktura VAT', icon: FileText },
    { id: '2', name: 'Oferta handlowa', icon: FileText },
    { id: '3', name: 'Raport miesięczny', icon: FileText },
  ];

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
              
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Szablon
                </label>
                <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                  <option>Pusty dokument</option>
                  <option>Faktura VAT</option>
                  <option>Oferta handlowa</option>
                  <option>Raport</option>
                </select>
              </div>

              <Textarea
                label="Treść dokumentu"
                placeholder="Wprowadź treść lub użyj AI do wygenerowania..."
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Podgląd
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    AI: Wygeneruj treść
                  </Button>
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Generuj PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Szablony</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <template.icon className="mr-2 h-4 w-4" />
                  {template.name}
                </Button>
              ))}
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Nowy szablon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ostatnie PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPDFs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {pdf.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {pdf.size}
                      </p>
                    </div>
                    <Badge variant="success">
                      {pdf.status === 'completed' ? 'Gotowe' : 'W trakcie'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-400">{pdf.date}</p>
                    <Button variant="ghost" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
