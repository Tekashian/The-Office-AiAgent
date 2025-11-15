'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 min-w-[300px] max-w-[500px] p-4 rounded-lg shadow-lg
              animate-in slide-in-from-top-5 duration-300
              ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : ''}
              ${toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
            {toast.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
            
            <p className={`
              text-sm font-medium flex-1
              ${toast.type === 'success' ? 'text-green-800 dark:text-green-200' : ''}
              ${toast.type === 'error' ? 'text-red-800 dark:text-red-200' : ''}
              ${toast.type === 'info' ? 'text-blue-800 dark:text-blue-200' : ''}
            `}>
              {toast.message}
            </p>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className={`
                h-4 w-4
                ${toast.type === 'success' ? 'text-green-600 dark:text-green-400' : ''}
                ${toast.type === 'error' ? 'text-red-600 dark:text-red-400' : ''}
                ${toast.type === 'info' ? 'text-blue-600 dark:text-blue-400' : ''}
              `} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
