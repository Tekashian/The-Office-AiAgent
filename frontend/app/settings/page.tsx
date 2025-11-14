'use client';

import React from 'react';
import { User, Bell, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Ustawienia
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Zarządzaj konfiguracją aplikacji i preferencjami
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle>Profil użytkownika</CardTitle>
            </div>
            <CardDescription>
              Zarządzaj swoimi danymi osobowymi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Imię i nazwisko" defaultValue="Jan Kowalski" />
              <Input label="Email" defaultValue="jan.kowalski@firma.pl" />
            </div>
            <div className="flex justify-end">
              <Button>Zapisz zmiany</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle>API Keys</CardTitle>
            </div>
            <CardDescription>
              Konfiguracja kluczy API dla integracji
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="AI API Key"
              type="password"
              placeholder="sk-..."
            />
            <Input
              label="Supabase URL"
              placeholder="https://..."
            />
            <Input
              label="Supabase Anon Key"
              type="password"
              placeholder="eyJ..."
            />
            <div className="flex justify-end">
              <Button>Zapisz konfigurację</Button>
            </div>
          </CardContent>
        </Card>

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
                defaultChecked
                className="h-4 w-4 rounded"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Powiadomienia o błędach
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Informuj o niepowodzeniach zadań
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
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
                className="h-4 w-4 rounded"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle>Dane i prywatność</CardTitle>
            </div>
            <CardDescription>
              Zarządzaj swoimi danymi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Eksportuj dane
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              Usuń wszystkie dane
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
