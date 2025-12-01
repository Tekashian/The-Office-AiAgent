"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

interface PDFRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const PDFRefreshContext = createContext<PDFRefreshContextType | undefined>(undefined);

export const PDFRefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);
  return (
    <PDFRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </PDFRefreshContext.Provider>
  );
};

export const usePDFRefresh = () => {
  const ctx = useContext(PDFRefreshContext);
  if (!ctx) throw new Error('usePDFRefresh must be used within PDFRefreshProvider');
  return ctx;
};
