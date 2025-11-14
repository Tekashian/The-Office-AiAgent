'use client';

import React, { useState } from 'react';
import { Globe, Play, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function ScraperPage() {
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('');

  const recentScrapes = [
    {
      id: '1',
      url: 'https://example.com/products',
      status: 'completed',
      items: 45,
      date: '2024-11-14 09:15',
    },
    {
      id: '2',
      url: 'https://competitor.com/prices',
      status: 'in_progress',
      items: 12,
      date: '2024-11-14 08:30',
    },
  ];

  const presets = [
    { id: '1', name: 'Cennik konkurencji', url: 'https://...' },
    { id: '2', name: 'Oferty pracy', url: 'https://...' },
    { id: '3', name: 'Wiadomości branżowe', url: 'https://...' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Web Scraper
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Automatycznie zbieraj dane ze stron internetowych
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nowe zadanie scrapowania</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="URL strony"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Selektor CSS (opcjonalnie)"
                  placeholder=".product-price"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Częstotliwość
                  </label>
                  <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                    <option>Jednorazowo</option>
                    <option>Co godzinę</option>
                    <option>Codziennie</option>
                    <option>Co tydzień</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Zaawansowane opcje
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Przetwórz AI po zebraniu danych
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Wyślij powiadomienie po zakończeniu
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Zapisz jako CSV
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  Test
                </Button>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Rozpocznij scrapowanie
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Historia scrapowania</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentScrapes.map((scrape) => (
                  <div
                    key={scrape.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {scrape.url}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {scrape.items} elementów • {scrape.date}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          scrape.status === 'completed' ? 'success' : 'info'
                        }
                      >
                        {scrape.status === 'completed' ? 'Gotowe' : 'W trakcie'}
                      </Badge>
                      {scrape.status === 'completed' && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predefiniowane</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {preset.name}
                </Button>
              ))}
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Nowy preset
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wskazówki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>💡 Użyj selektorów CSS aby precyzyjnie określić dane do zbierania</p>
              <p>🔄 Ustaw częstotliwość dla automatycznego monitorowania</p>
              <p>🤖 AI może automatycznie przetworzyć zebrane dane</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
