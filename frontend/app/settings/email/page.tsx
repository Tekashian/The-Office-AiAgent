'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { apiClient } from '@/lib/api';

interface EmailConfig {
  id: string;
  config_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  created_at: string;
}

export default function EmailSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    config_name: 'Default',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
  });

  useEffect(() => {
    checkUser();
    fetchConfigs();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
    } else {
      setUser(currentUser);
    }
  };

  const fetchConfigs = async () => {
    try {
      const response = await apiClient.get('/api/email-config');
      setConfigs(response.data.configs || []);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/api/email-config', {
        ...formData,
        smtp_port: parseInt(formData.smtp_port),
      });
      alert('Email configuration saved successfully!');
      setShowForm(false);
      setFormData({
        config_name: 'Default',
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
      });
      fetchConfigs();
    } catch (error: any) {
      alert(`Failed to save configuration: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (configName: string) => {
    try {
      await apiClient.post('/api/email-config/test', { config_name: configName });
      alert('Email configuration is working correctly!');
    } catch (error: any) {
      alert(`Test failed: ${error.response?.data?.details || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      await apiClient.delete(`/api/email-config/${id}`);
      alert('Configuration deleted successfully!');
      fetchConfigs();
    } catch (error: any) {
      alert(`Failed to delete: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Email Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={() => router.push('/agent')}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Chat
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">SMTP Configurations</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {showForm ? 'Cancel' : 'Add Configuration'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">New Email Configuration</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Config Name</label>
                <input
                  type="text"
                  value={formData.config_name}
                  onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                <input
                  type="text"
                  value={formData.smtp_host}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                <input
                  type="number"
                  value={formData.smtp_port}
                  onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP User (Email)</label>
                <input
                  type="email"
                  value={formData.smtp_user}
                  onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="your@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Password (App Password for Gmail)
                </label>
                <input
                  type="password"
                  value={formData.smtp_password}
                  onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  For Gmail: Generate an App Password at myaccount.google.com/apppasswords
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {configs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No email configurations yet. Add one to get started!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {configs.map((config) => (
                <li key={config.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{config.config_name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <p>Host: {config.smtp_host}</p>
                        <p>Port: {config.smtp_port}</p>
                        <p>User: {config.smtp_user}</p>
                        <p className="text-xs">Created: {new Date(config.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTest(config.config_name)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
