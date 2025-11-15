# 📚 Przewodnik Implementacji - The Office AI Agent

## 🎯 Przegląd Systemu

System składa się z 5 głównych modułów automatyzacji biurowej:

1. **AI Chat Agent** ✅ (ZAIMPLEMENTOWANY)
2. **Email Automation** 📧 (DO ZROBIENIA)
3. **PDF Generation** 📄 (DO ZROBIENIA)
4. **Web Scraping** 🌐 (DO ZROBIENIA)
5. **Scheduled Tasks (Cron)** ⏰ (DO ZROBIENIA)

---

## 1️⃣ AI Chat Agent ✅ (DZIAŁAJĄCY)

### Jak działa:
- Frontend wysyła wiadomość użytkownika + historię konwersacji do backendu
- Backend przekazuje to do Google Gemini API
- Gemini przetwarza i zwraca odpowiedź
- Frontend wyświetla odpowiedź w interfejsie czatu

### Już zaimplementowane:
- `backend/src/services/aiService.ts` - Komunikacja z Gemini API
- `backend/src/routes/agentRoutes.ts` - Endpoint `/api/agent/chat`
- `frontend/app/agent/page.tsx` - Interfejs czatu
- Historia konwersacji, auto-scroll, obsługa błędów

### Endpoint API:
```typescript
POST /api/agent/chat
Body: {
  message: string,
  conversationHistory: Array<{role: 'user' | 'model', text: string}>
}
```

---

## 2️⃣ Email Automation 📧

### Jak ma działać:
1. Użytkownik wypełnia formularz (odbiorcy, temat, treść)
2. Można dodać załączniki
3. Można wysłać natychmiast lub zaplanować
4. Backend używa Nodemailer do wysyłki

### Co trzeba zrobić:

#### A) Backend - Utworzyć routes dla emaili
```typescript
// backend/src/routes/emailRoutes.ts
import { Router } from 'express';
import emailService from '../services/emailService';

const router = Router();

// Wyślij email natychmiast
router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    await emailService.sendEmail({ to, subject, text, html });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wyślij email z AI-generowaną treścią
router.post('/send-with-ai', async (req, res) => {
  try {
    const { to, subject, prompt } = req.body;
    
    // Użyj AI do wygenerowania treści
    const content = await aiService.processTask(
      `Generate professional email content: ${prompt}`
    );
    
    await emailService.sendEmail({ to, subject, html: content });
    res.json({ success: true, generatedContent: content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

#### B) Dodać route do index.ts
```typescript
// backend/src/index.ts
import emailRoutes from './routes/emailRoutes';
app.use('/api/email', emailRoutes);
```

#### C) Frontend - Połączyć z API
```typescript
// frontend/app/email/page.tsx
const handleSend = async () => {
  try {
    const response = await apiClient.post('/api/email/send', {
      to: recipients.split(',').map(r => r.trim()),
      subject: subject,
      html: message,
    });
    
    if (response.data.success) {
      alert('Email wysłany!');
      // Wyczyść formularz
    }
  } catch (error) {
    console.error('Błąd wysyłki:', error);
  }
};
```

#### D) Konfiguracja .env
```env
# backend/.env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASSWORD=twoje-haslo-aplikacji
EMAIL_FROM=twoj-email@gmail.com
```

**Uwaga:** Dla Gmail musisz wygenerować "hasło aplikacji" w ustawieniach konta Google!

---

## 3️⃣ PDF Generation 📄

### Jak ma działać:
1. Użytkownik wprowadza tytuł i treść dokumentu
2. Może wybrać szablon (faktura, raport, oferta)
3. Może użyć AI do wygenerowania treści
4. Backend generuje PDF i zwraca link do pobrania

### Co trzeba zrobić:

#### A) Backend - Utworzyć routes dla PDF
```typescript
// backend/src/routes/pdfRoutes.ts
import { Router } from 'express';
import pdfService from '../services/pdfService';
import aiService from '../services/aiService';
import path from 'path';
import fs from 'fs';

const router = Router();

// Generuj PDF
router.post('/generate', async (req, res) => {
  try {
    const { title, content, template } = req.body;
    
    const filename = `${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads', filename);
    
    // Upewnij się że folder uploads istnieje
    if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
      fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
    }
    
    await pdfService.generatePDF(content, outputPath, {
      title,
      author: 'Office Agent AI',
    });
    
    res.json({ 
      success: true, 
      filename,
      downloadUrl: `/api/pdf/download/${filename}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generuj PDF z AI
router.post('/generate-with-ai', async (req, res) => {
  try {
    const { title, prompt, template } = req.body;
    
    // AI generuje treść
    const content = await aiService.processTask(
      `Generate ${template || 'document'} content: ${prompt}`
    );
    
    const filename = `${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    const outputPath = path.join(__dirname, '../../uploads', filename);
    
    await pdfService.generatePDF(content, outputPath, { title });
    
    res.json({ 
      success: true, 
      filename,
      generatedContent: content,
      downloadUrl: `/api/pdf/download/${filename}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pobierz PDF
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, '../../uploads', filename);
  
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
```

#### B) Frontend - Implementacja
```typescript
// frontend/app/pdf/page.tsx
const handleGenerate = async () => {
  try {
    setIsGenerating(true);
    
    const response = await apiClient.post('/api/pdf/generate', {
      title: title,
      content: content,
    });
    
    if (response.data.success) {
      // Pobierz PDF
      window.open(`http://localhost:3001${response.data.downloadUrl}`, '_blank');
      alert('PDF wygenerowany!');
    }
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    setIsGenerating(false);
  }
};

const handleAIGenerate = async () => {
  try {
    const prompt = `Generate invoice for ${title} with following details: ${content}`;
    
    const response = await apiClient.post('/api/pdf/generate-with-ai', {
      title: title,
      prompt: prompt,
      template: 'invoice',
    });
    
    if (response.data.success) {
      setContent(response.data.generatedContent);
      window.open(`http://localhost:3001${response.data.downloadUrl}`, '_blank');
    }
  } catch (error) {
    console.error('Błąd:', error);
  }
};
```

---

## 4️⃣ Web Scraping 🌐

### Jak ma działać:
1. Użytkownik podaje URL strony
2. Opcjonalnie podaje selektor CSS dla konkretnych danych
3. Backend używa Cheerio do scrapowania
4. Dane są zapisywane lub przetwarzane przez AI

### Co trzeba zrobić:

#### A) Backend - Routes dla scrapera
```typescript
// backend/src/routes/scraperRoutes.ts
import { Router } from 'express';
import scraperService from '../services/scraperService';
import aiService from '../services/aiService';

const router = Router();

// Scrapuj stronę
router.post('/scrape', async (req, res) => {
  try {
    const { url, selectors } = req.body;
    
    const data = await scraperService.scrapeWebPage({
      url,
      selectors,
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scrapuj i przetwórz AI
router.post('/scrape-and-analyze', async (req, res) => {
  try {
    const { url, selectors, analysisPrompt } = req.body;
    
    // Scrapuj dane
    const data = await scraperService.scrapeWebPage({ url, selectors });
    
    // AI analizuje dane
    const analysis = await aiService.processTask(
      `Analyze this scraped data: ${JSON.stringify(data)}. ${analysisPrompt}`
    );
    
    res.json({ success: true, data, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lista ostatnich scrapowań (do zapisania w bazie)
router.get('/history', async (req, res) => {
  // TODO: Implementacja z Supabase
  res.json({ success: true, history: [] });
});

export default router;
```

#### B) Frontend - Implementacja
```typescript
// frontend/app/scraper/page.tsx
const handleScrape = async () => {
  try {
    setIsLoading(true);
    
    const response = await apiClient.post('/api/scraper/scrape', {
      url: url,
      selectors: selector ? { data: selector } : undefined,
    });
    
    if (response.data.success) {
      setResults(response.data.data);
      alert('Dane pobrane!');
    }
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 5️⃣ Scheduled Tasks (Cron) ⏰

### Jak ma działać:
1. Użytkownik tworzy zadanie z wyrażeniem cron (np. "0 8 * * *")
2. Wybiera typ akcji (email, PDF, scraping, AI)
3. Backend uruchamia zadanie zgodnie z harmonogramem
4. Można wstrzymać/wznowić/usunąć zadania

### Co trzeba zrobić:

#### A) Backend - Routes dla zadań
```typescript
// backend/src/routes/cronRoutes.ts
import { Router } from 'express';
import cronService from '../services/cronService';
import emailService from '../services/emailService';
import pdfService from '../services/pdfService';

const router = Router();

// Utwórz nowe zadanie
router.post('/create', async (req, res) => {
  try {
    const { name, schedule, taskType, taskConfig } = req.body;
    
    // Definiuj zadanie w zależności od typu
    let task: () => Promise<void>;
    
    switch (taskType) {
      case 'email':
        task = async () => {
          await emailService.sendEmail(taskConfig);
        };
        break;
        
      case 'pdf':
        task = async () => {
          await pdfService.generatePDF(
            taskConfig.content,
            taskConfig.outputPath,
            taskConfig.options
          );
        };
        break;
        
      case 'scraper':
        task = async () => {
          const scraperService = (await import('../services/scraperService')).default;
          await scraperService.scrapeWebPage(taskConfig);
        };
        break;
        
      default:
        throw new Error('Unknown task type');
    }
    
    cronService.scheduleJob({
      name,
      schedule,
      task,
      enabled: true,
    });
    
    res.json({ success: true, message: 'Task scheduled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lista zadań
router.get('/list', (req, res) => {
  const jobs = cronService.getActiveJobs();
  res.json({ success: true, jobs });
});

// Zatrzymaj zadanie
router.post('/stop/:name', (req, res) => {
  try {
    cronService.stopJob(req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wznów zadanie
router.post('/start/:name', (req, res) => {
  try {
    cronService.startJob(req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

#### B) Frontend - Implementacja
```typescript
// frontend/app/tasks/page.tsx
const handleCreateTask = async () => {
  try {
    const response = await apiClient.post('/api/cron/create', {
      name: taskName,
      schedule: schedule, // np. "0 8 * * *"
      taskType: 'email', // lub 'pdf', 'scraper'
      taskConfig: {
        to: 'team@company.com',
        subject: 'Daily Report',
        text: 'Automated daily report',
      },
    });
    
    if (response.data.success) {
      alert('Zadanie utworzone!');
      loadTasks();
    }
  } catch (error) {
    console.error('Błąd:', error);
  }
};
```

---

## 🔧 Kolejność Implementacji (Rekomendowana)

### Faza 1: Email Automation (najprostsza) 📧
1. Utworzyć `backend/src/routes/emailRoutes.ts`
2. Dodać route do `index.ts`
3. Skonfigurować Gmail App Password w `.env`
4. Połączyć frontend z API
5. Testować wysyłkę emaili

**Czas: 1-2 godziny**

### Faza 2: PDF Generation 📄
1. Utworzyć `backend/src/routes/pdfRoutes.ts`
2. Utworzyć folder `backend/uploads/`
3. Dodać endpoint do pobierania plików
4. Połączyć frontend z API
5. Testować generowanie PDF

**Czas: 2-3 godziny**

### Faza 3: Web Scraping 🌐
1. Utworzyć `backend/src/routes/scraperRoutes.ts`
2. Połączyć frontend z API
3. Testować na prostych stronach
4. Dodać integrację z AI dla analizy danych

**Czas: 2-3 godziny**

### Faza 4: Scheduled Tasks ⏰
1. Utworzyć `backend/src/routes/cronRoutes.ts`
2. Integrować z innymi modułami
3. Dodać perzystencję zadań (Supabase)
4. Połączyć frontend z API

**Czas: 3-4 godziny**

---

## 📦 Supabase Integration (Opcjonalne)

### Struktura bazy danych:

```sql
-- Tabela zadań
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Tabela emaili
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_addresses TEXT[],
  subject TEXT,
  status VARCHAR(50),
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Tabela PDF
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  filename TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela scrapowania
CREATE TABLE scrapes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT,
  data JSONB,
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Tabela cron jobs
CREATE TABLE cron_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE,
  schedule TEXT,
  task_type TEXT,
  config JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Konfiguracja Supabase:
```typescript
// backend/src/config/supabase.ts (już istnieje)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default supabase;
```

---

## 🚀 Quick Start - Implementacja pierwszej funkcji

### Zaczynamy od EMAIL AUTOMATION:

```bash
# 1. Terminal - backend
cd backend
npm run dev

# 2. Terminal - frontend
cd frontend
npm run dev
```

**Następny krok:** Utworzyć `backend/src/routes/emailRoutes.ts` i połączyć z API!

---

## 📚 Przydatne Linki

- **Nodemailer Docs:** https://nodemailer.com/about/
- **PDFKit Docs:** https://pdfkit.org/
- **Cheerio Docs:** https://cheerio.js.org/
- **Node-Cron Docs:** https://www.npmjs.com/package/node-cron
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **Supabase Docs:** https://supabase.com/docs

---

## ❓ FAQ

**Q: Czy muszę implementować wszystko na raz?**
A: Nie! Zacznij od jednej funkcji (polecam Email), przetestuj, a potem przejdź do kolejnej.

**Q: Jak przetestować email bez konta Gmail?**
A: Możesz użyć Ethereal Email (testowy SMTP): https://ethereal.email/

**Q: Czy mogę użyć innego AI zamiast Gemini?**
A: Tak! Wystarczy zmodyfikować `aiService.ts` aby korzystać z innego API (OpenAI, Claude, etc.)

**Q: Jak zabezpieczyć API przed nieautoryzowanym dostępem?**
A: Dodaj middleware JWT authentication w `backend/src/middleware/auth.ts`

---

## 🎯 Gotowy do rozpoczęcia?

**Następny krok:** Stwórz `backend/src/routes/emailRoutes.ts` i zacznij od Email Automation! 🚀
