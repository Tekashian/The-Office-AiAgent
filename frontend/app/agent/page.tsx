'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Loader2, LogOut, Settings, User, ChevronDown, Mail, Shield, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { apiClient } from '@/lib/api';
import { getCurrentUser, signOut } from '@/lib/auth';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function AgentPage() {
  const [user, setUser] = useState<{ email?: string; id?: string; created_at?: string; email_confirmed_at?: string } | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'Cześć! Jestem Twoim AI agentem biurowym. Mogę pomóc Ci w automatyzacji zadań, wysyłaniu emaili, generowaniu PDF-ów i wiele więcej. W czym mogę Ci dziś pomóc?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth');
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history in Gemini format
      // Only include messages that have actual content
      const conversationHistory = messages
        .filter((msg) => msg.id !== '1' && msg.content && msg.content.trim()) // Exclude initial greeting and empty messages
        .map((msg) => ({
          role: msg.role,
          text: msg.content, // Backend expects 'text' not 'parts'
        }));

      const response = await apiClient.post('/api/agent/chat', {
        message: userMessage.content,
        conversationHistory,
      });

      if (response.data.success) {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: response.data.data.content,
          timestamp: new Date(response.data.data.timestamp),
        };
        setMessages((prev) => [...prev, agentMessage]);
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości. Upewnij się, że backend jest uruchomiony i klucz API Gemini jest skonfigurowany w pliku .env.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header with navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">AI Agent Chat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/settings/email')}
                className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </button>

              {/* Profile Dropdown */}
              <div className="relative profile-dropdown-container">
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">Profil</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProfileDropdown && user && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Profile Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500">Personal Account</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="px-4 py-3 space-y-3">
                      <div className="flex items-start space-x-3">
                        <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-900 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">User ID</p>
                          <p className="text-xs font-mono text-gray-700 truncate">{user.id?.substring(0, 24)}...</p>
                        </div>
                      </div>

                      {user.created_at && (
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Member Since</p>
                            <p className="text-sm text-gray-900">
                              {new Date(user.created_at).toLocaleDateString('pl-PL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Status</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="w-2 h-2 mr-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">Email Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.email_confirmed_at 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.email_confirmed_at ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 px-2 py-2">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          router.push('/settings/email');
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Account Settings
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Rozmawiaj z agentem AI i automatyzuj swoje zadania
        </p>

        <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col p-0">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex max-w-[80%] gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <span className="text-sm font-medium">JA</span>
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.role === 'user'
                          ? 'text-primary-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-800">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Opisz zadanie dla AI agenta..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
                <Button variant="outline" size="sm" className="h-full">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Naciśnij Enter aby wysłać, Shift+Enter dla nowej linii
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
