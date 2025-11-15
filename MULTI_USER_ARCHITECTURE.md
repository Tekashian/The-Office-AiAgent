# 🔐 System Użytkowników & Autoryzacji - Architektura

## 📊 BAZA DANYCH: **SUPABASE (PostgreSQL)**

Używamy **Supabase** jako głównej bazy danych i systemu autoryzacji.

**Dlaczego Supabase?**
- ✅ Wbudowana autentykacja (Auth)
- ✅ PostgreSQL + REST API
- ✅ Real-time subscriptions
- ✅ Row Level Security (RLS)
- ✅ Storage dla plików
- ✅ Edge Functions

---

## 🏗️ ARCHITEKTURA SYSTEMU MULTI-USER

### **Model Danych**

```
┌─────────────┐
│   USERS     │ (Supabase Auth - wbudowane)
├─────────────┤
│ id (UUID)   │
│ email       │
│ password    │
│ created_at  │
└─────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│  USER_PROFILES   │ (Tabela custom)
├──────────────────┤
│ id (UUID) PK     │
│ user_id FK       │ → users.id
│ full_name        │
│ company          │
│ plan (enum)      │ → free/pro/enterprise
│ created_at       │
│ updated_at       │
└──────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────────┐
│  USER_EMAIL_CONFIGS  │ (Konfiguracje email per user)
├──────────────────────┤
│ id (UUID) PK         │
│ user_id FK           │ → users.id
│ email_provider       │ → gmail/outlook/custom
│ smtp_host            │
│ smtp_port            │
│ smtp_user            │
│ smtp_password_enc    │ (szyfrowane!)
│ is_active            │
│ created_at           │
└──────────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  EMAILS_SENT     │     │    PDF_FILES     │     │  SCRAPE_JOBS     │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (UUID) PK     │     │ id (UUID) PK     │     │ id (UUID) PK     │
│ user_id FK       │     │ user_id FK       │     │ user_id FK       │
│ to_addresses[]   │     │ title            │     │ url              │
│ subject          │     │ filename         │     │ selectors JSONB  │
│ status           │     │ file_path        │     │ status           │
│ sent_at          │     │ file_size        │     │ data JSONB       │
│ error_msg        │     │ created_at       │     │ scheduled_at     │
└──────────────────┘     └──────────────────┘     │ completed_at     │
                                                   └──────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│   CRON_JOBS      │ (Zaplanowane zadania)
├──────────────────┤
│ id (UUID) PK     │
│ user_id FK       │ → users.id
│ name             │
│ cron_expression  │
│ task_type        │ → email/pdf/scraper/ai
│ task_config JSONB│
│ is_active        │
│ last_run_at      │
│ next_run_at      │
│ created_at       │
└──────────────────┘
```

---

## 🔑 FLOW AUTORYZACJI

### **1. Rejestracja Użytkownika**

```typescript
// Frontend
import { supabase } from '@/lib/supabase';

const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Automatycznie tworzy się rekord w auth.users
  // Teraz tworzymy profil
  await supabase.from('user_profiles').insert({
    user_id: data.user!.id,
    full_name: '',
    plan: 'free',
  });
};
```

### **2. Logowanie**

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Supabase automatycznie zapisuje JWT token w localStorage
  return data.session; // Zawiera access_token
};
```

### **3. Middleware Autoryzacji (Backend)**

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    // Weryfikacja tokenu przez Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // Dodaj user ID do request
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

### **4. Używanie Middleware w Routes**

```typescript
// backend/src/routes/emailRoutes.ts
import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import emailService from '../services/emailService';
import supabase from '../config/supabase';

const router = Router();

// Wszystkie routes wymagają autoryzacji
router.use(authenticateUser);

router.post('/send', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!; // Mamy user ID z middleware
    const { to, subject, text } = req.body;
    
    // Pobierz konfigurację email użytkownika
    const { data: emailConfig } = await supabase
      .from('user_email_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (!emailConfig) {
      return res.status(400).json({ error: 'Email not configured' });
    }
    
    // Użyj konfiguracji użytkownika do wysłania
    await emailService.sendEmailWithConfig(emailConfig, { to, subject, text });
    
    // Zapisz w historii
    await supabase.from('emails_sent').insert({
      user_id: userId,
      to_addresses: [to],
      subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 🔐 BEZPIECZNE PRZECHOWYWANIE DANYCH EMAIL

### **Problem:** Jak bezpiecznie przechowywać hasła SMTP użytkowników?

### **Rozwiązanie: Szyfrowanie AES-256**

```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bajty (64 hex chars)
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

### **Zapisywanie konfiguracji email:**

```typescript
// backend/src/routes/emailConfigRoutes.ts
import { encrypt, decrypt } from '../utils/encryption';

router.post('/config', authenticateUser, async (req: AuthRequest, res) => {
  const { smtp_host, smtp_port, smtp_user, smtp_password } = req.body;
  
  // Szyfruj hasło przed zapisaniem
  const encryptedPassword = encrypt(smtp_password);
  
  await supabase.from('user_email_configs').insert({
    user_id: req.userId,
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password_enc: encryptedPassword,
    is_active: true,
  });
  
  res.json({ success: true });
});
```

### **Używanie konfiguracji:**

```typescript
// backend/src/services/emailService.ts
export class EmailService {
  async sendEmailWithConfig(config: any, emailData: any) {
    // Odszyfruj hasło
    const decryptedPassword = decrypt(config.smtp_password_enc);
    
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      auth: {
        user: config.smtp_user,
        pass: decryptedPassword,
      },
    });
    
    await transporter.sendMail(emailData);
  }
}
```

---

## 📋 SQL SCHEMA - SUPABASE

### **Kompletny schemat do wklejenia w Supabase SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  company TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EMAIL CONFIGURATIONS
CREATE TABLE user_email_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_provider TEXT DEFAULT 'gmail',
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_password_enc TEXT NOT NULL, -- Encrypted!
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EMAILS HISTORY
CREATE TABLE emails_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PDF FILES
CREATE TABLE pdf_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  template_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SCRAPE JOBS
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  selectors JSONB,
  frequency TEXT, -- once, hourly, daily, weekly
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  data JSONB,
  error_message TEXT,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CRON JOBS
CREATE TABLE cron_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('email', 'pdf', 'scraper', 'ai')),
  task_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. AI CHAT HISTORY
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for better performance
CREATE INDEX idx_emails_user_id ON emails_sent(user_id);
CREATE INDEX idx_pdfs_user_id ON pdf_files(user_id);
CREATE INDEX idx_scrapes_user_id ON scrape_jobs(user_id);
CREATE INDEX idx_crons_user_id ON cron_jobs(user_id);
CREATE INDEX idx_chat_user_id ON chat_messages(user_id);

-- ROW LEVEL SECURITY (RLS)
-- Users can only see their own data

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (każdy user widzi tylko swoje dane)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email configs" ON user_email_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emails" ON emails_sent
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own PDFs" ON pdf_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scrapes" ON scrape_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cron jobs" ON cron_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat history" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_configs_updated_at
  BEFORE UPDATE ON user_email_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cron_jobs_updated_at
  BEFORE UPDATE ON cron_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔄 FLOW POŁĄCZENIA Z GMAILEM UŻYTKOWNIKA

### **Krok 1: Użytkownik konfiguruje Gmail**

#### **Frontend - Formularz konfiguracji:**

```typescript
// frontend/app/settings/page.tsx
const [emailConfig, setEmailConfig] = useState({
  provider: 'gmail',
  email: '',
  appPassword: '', // Gmail App Password, NIE zwykłe hasło!
});

const handleSaveEmailConfig = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await apiClient.post(
    '/api/email-config/save',
    {
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_user: emailConfig.email,
      smtp_password: emailConfig.appPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    }
  );
  
  if (response.data.success) {
    alert('Email configured successfully!');
  }
};
```

### **Krok 2: Backend zapisuje zaszyfrowaną konfigurację**

```typescript
// backend/src/routes/emailConfigRoutes.ts
router.post('/save', authenticateUser, async (req: AuthRequest, res) => {
  const { smtp_host, smtp_port, smtp_user, smtp_password } = req.body;
  
  // Szyfruj hasło
  const encryptedPassword = encrypt(smtp_password);
  
  // Sprawdź czy konfiguracja już istnieje
  const { data: existing } = await supabase
    .from('user_email_configs')
    .select('id')
    .eq('user_id', req.userId)
    .single();
  
  if (existing) {
    // Update
    await supabase
      .from('user_email_configs')
      .update({
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password_enc: encryptedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', req.userId);
  } else {
    // Insert
    await supabase.from('user_email_configs').insert({
      user_id: req.userId,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password_enc: encryptedPassword,
    });
  }
  
  res.json({ success: true });
});
```

### **Krok 3: Wysyłanie emaila używając konfiguracji użytkownika**

```typescript
// backend/src/routes/emailRoutes.ts
router.post('/send', authenticateUser, async (req: AuthRequest, res) => {
  const { to, subject, html } = req.body;
  
  // 1. Pobierz konfigurację użytkownika
  const { data: config } = await supabase
    .from('user_email_configs')
    .select('*')
    .eq('user_id', req.userId)
    .eq('is_active', true)
    .single();
  
  if (!config) {
    return res.status(400).json({ 
      error: 'Email not configured. Please configure in Settings.' 
    });
  }
  
  // 2. Odszyfruj hasło
  const decryptedPassword = decrypt(config.smtp_password_enc);
  
  // 3. Utwórz transporter z danymi użytkownika
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: decryptedPassword,
    },
  });
  
  // 4. Wyślij email
  try {
    await transporter.sendMail({
      from: config.smtp_user,
      to,
      subject,
      html,
    });
    
    // 5. Zapisz w historii
    await supabase.from('emails_sent').insert({
      user_id: req.userId,
      to_addresses: [to],
      subject,
      body_html: html,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
    
    res.json({ success: true });
  } catch (error) {
    // Zapisz błąd
    await supabase.from('emails_sent').insert({
      user_id: req.userId,
      to_addresses: [to],
      subject,
      status: 'failed',
      error_message: error.message,
    });
    
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📝 INSTRUKCJE DLA UŻYTKOWNIKA - GMAIL APP PASSWORD

### **Frontend - Wyświetl instrukcje:**

```tsx
// frontend/app/settings/email-setup.tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
  <h4 className="font-bold mb-2">📧 Jak skonfigurować Gmail:</h4>
  <ol className="list-decimal list-inside space-y-1 text-sm">
    <li>Przejdź do: <a href="https://myaccount.google.com/security" className="text-blue-600">Google Account Security</a></li>
    <li>Włącz "2-Step Verification"</li>
    <li>Kliknij "App passwords"</li>
    <li>Wygeneruj nowe hasło aplikacji dla "Mail"</li>
    <li>Skopiuj 16-znakowe hasło i wklej tutaj</li>
  </ol>
</div>
```

---

## 🎯 PLAN IMPLEMENTACJI (KROK PO KROKU)

### **Dzień 1: Supabase Setup**
1. ✅ Utwórz projekt w Supabase
2. ✅ Uruchom SQL schema powyżej
3. ✅ Skopiuj URL i klucze do `.env`
4. ✅ Przetestuj połączenie

### **Dzień 2: System Autoryzacji**
1. ✅ Stwórz `backend/src/middleware/auth.ts`
2. ✅ Stwórz `backend/src/utils/encryption.ts`
3. ✅ Dodaj login/register endpoints
4. ✅ Dodaj middleware do routes

### **Dzień 3: Email Configuration**
1. ✅ Stwórz `emailConfigRoutes.ts`
2. ✅ Dodaj formularz w Settings
3. ✅ Zintegruj z `emailRoutes.ts`
4. ✅ Testuj wysyłkę

### **Dzień 4: Remaining Features**
1. ✅ PDF - zapisuj do `pdf_files` z `user_id`
2. ✅ Scraper - zapisuj do `scrape_jobs` z `user_id`
3. ✅ Cron - zapisuj do `cron_jobs` z `user_id`
4. ✅ Chat history - zapisuj do `chat_messages`

---

## 🔐 ZMIENNE ŚRODOWISKOWE

### **Backend `.env`:**
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx... (opcjonalne, dla admin operations)

# Encryption (wygeneruj: openssl rand -hex 32)
ENCRYPTION_KEY=your_64_character_hex_key_here

# Gemini AI
AI_API_KEY=AIzaSyD_QxqYAO4_jwipRPC07QcOi5AlapPnZr8
AI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
AI_MODEL=gemini-2.5-flash

# Server
PORT=3001
NODE_ENV=development
```

### **Frontend `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## ✅ CHECKLIST IMPLEMENTACJI

### **Backend:**
- [ ] Utworzyć `middleware/auth.ts`
- [ ] Utworzyć `utils/encryption.ts`
- [ ] Utworzyć `routes/authRoutes.ts` (login/register)
- [ ] Utworzyć `routes/emailConfigRoutes.ts`
- [ ] Dodać `authenticateUser` do wszystkich routes
- [ ] Modyfikować `emailRoutes.ts` - używać user config
- [ ] Modyfikować `pdfRoutes.ts` - zapisywać do `pdf_files`
- [ ] Modyfikować `scraperRoutes.ts` - zapisywać do `scrape_jobs`
- [ ] Modyfikować `cronRoutes.ts` - zapisywać do `cron_jobs`
- [ ] Modyfikować `agentRoutes.ts` - zapisywać historię czatu

### **Frontend:**
- [ ] Stworzyć `app/login/page.tsx`
- [ ] Stworzyć `app/register/page.tsx`
- [ ] Dodać Auth Context Provider
- [ ] Modyfikować `lib/api.ts` - dodać token do headers
- [ ] Dodać formularz email config w Settings
- [ ] Dodać protected routes (redirect jeśli niezalogowany)

### **Supabase:**
- [ ] Utworzyć projekt
- [ ] Uruchomić SQL schema
- [ ] Włączyć Email Auth
- [ ] Skonfigurować RLS policies
- [ ] Przetestować autoryzację

---

## 🚀 GOTOWY DO STARTU?

**Następny krok:** Utworzyć projekt Supabase i uruchomić SQL schema!

1. Przejdź do https://supabase.com
2. Utwórz nowy projekt
3. Otwórz SQL Editor
4. Wklej powyższy schema
5. Skopiuj URL i klucze do `.env`

Gotowe! 🎉
