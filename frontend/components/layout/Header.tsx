'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, User, ChevronDown, Mail, Shield, Calendar, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { getCurrentUser, signOut } from '@/lib/auth';

export function Header() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<{ 
    email?: string; 
    id?: string; 
    created_at?: string; 
    email_confirmed_at?: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load user data
    getCurrentUser().then(currentUser => {
      setUser(currentUser);
    });
  }, []);

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

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-950/95">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Szukaj zadań, emaili, dokumentów..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          </Button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

          {/* Profile Dropdown */}
          <div className="relative profile-dropdown-container">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleProfileDropdown}
              className="gap-2"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Profil</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </Button>

            {showProfileDropdown && user && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 dark:bg-gray-900 dark:border-gray-700">
                {/* Profile Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Personal Account</p>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm text-gray-900 dark:text-white truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                      <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                        {user.id?.substring(0, 24)}...
                      </p>
                    </div>
                  </div>

                  {user.created_at && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                        <p className="text-sm text-gray-900 dark:text-white">
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
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <span className="w-2 h-2 mr-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Email Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.email_confirmed_at 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {user.email_confirmed_at ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-2">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      router.push('/settings');
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
    </header>
  );
}
