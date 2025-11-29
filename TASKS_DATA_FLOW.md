# ⏰ ZAPLANOWANE ZADANIA (CRON JOBS) - PEŁNY PRZEPŁYW DANYCH

## 📋 SPIS TREŚCI
1. [Architektura Systemu](#architektura-systemu)
2. [Przepływ TAM (Frontend → Backend → Database)](#przepływ-tam)
3. [Przepływ Z POWROTEM (Database → Backend → Frontend)](#przepływ-z-powrotem)
4. [Automatyczne Wykonanie (Cron Trigger)](#automatyczne-wykonanie)
5. [Przykład Krok Po Kroku](#przykład-krok-po-kroku)
6. [Pliki i Funkcje](#pliki-i-funkcje)

---

## 🏗️ ARCHITEKTURA SYSTEMU

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  app/tasks/page.tsx                                        │ │
│  │  - UI: Lista zadań, Modal tworzenia, Przyciski akcji      │ │
│  │  - State: jobs[], jobName, scheduleType, jobConfig        │ │
│  │  - Functions: fetchJobs(), handleSaveJob(), handleToggle()│ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  lib/api.ts (fetch z JWT token)                           │ │
│  │  - Automatyczne dodawanie Authorization header            │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                         │ HTTP Request (localhost:3001)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express + Node.js)                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  middleware/auth.ts                                        │ │
│  │  - Sprawdza JWT token                                      │ │
│  │  - Wyciąga userId                                          │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  routes/cronRoutes.ts                                      │ │
│  │  - POST   /api/cron/create       (utwórz zadanie)         │ │
│  │  - GET    /api/cron/jobs         (lista zadań)            │ │
│  │  - PUT    /api/cron/jobs/:id     (edytuj zadanie)         │ │
│  │  - POST   /api/cron/jobs/:id/start (uruchom)              │ │
│  │  - POST   /api/cron/jobs/:id/stop  (zatrzymaj)            │ │
│  │  - DELETE /api/cron/jobs/:id     (usuń)                   │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  services/cronService.ts                                   │ │
│  │  - scheduleJob()  (utwórz cron task)                      │ │
│  │  - startJob()     (włącz wykonywanie)                     │ │
│  │  - stopJob()      (wyłącz wykonywanie)                    │ │
│  │  - stopAllJobs()  (zatrzymaj wszystkie)                   │ │
│  │  Library: node-cron (automatyczne wykonywanie zadań)      │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (Supabase PostgreSQL)              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  cron_jobs                                                 │ │
│  │  - id, user_id, name, schedule, task_type, task_config,   │ │
│  │    enabled, status, last_run, execution_count             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                         ⏰
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATIC EXECUTION (node-cron)              │
│  Sprawdza co minutę: Czy schedule pasuje do aktualnego czasu?   │
│  Jeśli TAK → Wykonuje task():                                   │
│    - 📧 Wysyła email (SMTP)                                     │
│    - 📄 Generuje PDF (pdfkit + Supabase Storage)               │
│    - 🌐 Scrapuje stronę (axios + cheerio)                      │
│  Aktualizuje: last_run, execution_count                         │
│  Tworzy notyfikację dla użytkownika                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 PRZEPŁYW TAM (Frontend → Backend → Database)

### PRZYKŁAD: User Tworzy Nowe Zadanie "Cotygodniowy Raport"

```
┌─────────────────────────────────────────────────────────────────┐
│ KROK 1: FRONTEND - User Wypełnia Formularz                     │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: frontend/app/tasks/page.tsx (linia 353-399)

User:
1. Kliknął przycisk "Nowe zadanie"
2. Wypełnił formularz:
   - Nazwa: "Cotygodniowy raport sprzedaży"
   - Typ: Email
   - Harmonogram: Cyklicznie → Co tydzień → Poniedziałek 9:00
   - Konfiguracja JSON:
     {
       "recipient": "boss@company.com",
       "subject": "Raport tygodniowy",
       "body": "Załączam raport sprzedaży..."
     }
3. Kliknął "Utwórz zadanie"

┌─────────────────────────────────────────────────────────────────┐
│ Frontend: handleSaveJob() konwertuje dane                      │
│                                                                 │
│ scheduleType: 'recurring'                                       │
│ recurringType: 'weekly'                                         │
│ scheduledTime: '09:00'                                          │
│   ↓                                                             │
│ recurringToCron('weekly', '09:00')                              │
│   ↓                                                             │
│ cronExpression = '0 9 * * 1'  // Każdy poniedziałek o 9:00     │
└─────────────────────────────────────────────────────────────────┘

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 2: FRONTEND - Wysyła Request do API                       │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: frontend/app/tasks/page.tsx (linia 362-379)

┌─────────────────────────────────────────────────────────────────┐
│ const response = await fetch(                                  │
│   'http://localhost:3001/api/cron/create',                     │
│   {                                                             │
│     method: 'POST',                                             │
│     headers: {                                                  │
│       'Authorization': 'Bearer eyJhbGc...',  // JWT token       │
│       'Content-Type': 'application/json'                        │
│     },                                                          │
│     body: JSON.stringify({                                      │
│       name: 'Cotygodniowy raport sprzedaży',                    │
│       schedule: '0 9 * * 1',                                    │
│       task_type: 'email',                                       │
│       task_config: {                                            │
│         recipient: 'boss@company.com',                          │
│         subject: 'Raport tygodniowy',                           │
│         body: 'Załączam raport sprzedaży...'                    │
│       },                                                        │
│       enabled: true                                             │
│     })                                                          │
│   }                                                             │
│ );                                                              │
└─────────────────────────────────────────────────────────────────┘

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 3: BACKEND - Middleware Sprawdza JWT Token                │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/middleware/auth.ts

const token = req.headers.authorization.split(' ')[1];
const { data: { user } } = await supabase.auth.getUser(token);
req.userId = user.id;  // Dodaje userId = "user-abc-123"

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 4: BACKEND - Route Handler Przetwarza Request             │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/routes/cronRoutes.ts (linia 28-60)

1️⃣ WALIDACJA:
   if (!name || !schedule || !task_type) → błąd 400

2️⃣ ZAPIS DO BAZY:
   await supabaseAdmin.from('cron_jobs').insert({
     user_id: 'user-abc-123',  // Z JWT token
     name: 'Cotygodniowy raport sprzedaży',
     schedule: '0 9 * * 1',
     task_type: 'email',
     task_config: {
       recipient: 'boss@company.com',
       subject: 'Raport tygodniowy',
       body: 'Załączam raport sprzedaży...'
     },
     enabled: true,
     status: 'pending',
     execution_count: 0,
     created_at: NOW()
   });

   Baza zwraca: data = { id: 'job-xyz-789', ...wszystkie pola }

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 5: BACKEND - Uruchomienie Cron Job                        │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/routes/cronRoutes.ts (linia 62-330)

cronService.scheduleJob({
  name: 'job-xyz-789',  // ID z bazy
  schedule: '0 9 * * 1',  // Każdy poniedziałek o 9:00
  enabled: true,
  task: async () => {
    // ⏰ TO SIĘ WYKONA AUTOMATYCZNIE KAŻDY PONIEDZIAŁEK O 9:00
    
    console.log('Wykonuję cotygodniowy raport...');
    
    // Aktualizuj last_run w bazie
    await supabaseAdmin.from('cron_jobs').update({
      last_run: new Date().toISOString(),
      execution_count: execution_count + 1,
      status: 'running'
    }).eq('id', 'job-xyz-789');
    
    // WYKONAJ ZADANIE (email, PDF, scraping, etc.)
    if (task_type === 'email') {
      // Pobierz SMTP config z bazy
      const { data: smtpConfig } = await supabaseAdmin
        .from('user_imap_configs')
        .select('*')
        .eq('user_id', 'user-abc-123')
        .eq('is_active', true)
        .single();
      
      // Wyślij email
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        auth: {
          user: smtpConfig.imap_user,
          pass: decrypt(smtpConfig.imap_password)
        }
      });
      
      await transporter.sendMail({
        from: smtpConfig.imap_user,
        to: 'boss@company.com',
        subject: 'Raport tygodniowy',
        text: 'Załączam raport sprzedaży...'
      });
      
      console.log('✅ Email wysłany!');
      
      // Stwórz notyfikację dla usera
      await createNotification(
        'user-abc-123',
        'email_sent',
        'Email wysłany: Raport tygodniowy',
        'Cotygodniowy raport został wysłany do boss@company.com'
      );
    }
    
    // Zmień status z powrotem na 'active'
    await supabaseAdmin.from('cron_jobs').update({
      status: 'active'
    }).eq('id', 'job-xyz-789');
  }
});

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 6: CRON SERVICE - Rejestracja w node-cron                 │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/services/cronService.ts (linia 45-68)

// Waliduj cron expression
cron.validate('0 9 * * 1') → ✅ poprawny

// Utwórz cron task
const task = cron.schedule(
  '0 9 * * 1',  // Schedule
  async () => {
    // Wykona task() funkcję z KROKU 5
    await config.task();
  }
);

// Zapisz w Map (do późniejszego zarządzania)
this.jobs.set('job-xyz-789', task);

┌─────────────────────────────────────────────────────────────────┐
│ 🎉 node-cron teraz automatycznie sprawdza co minutę:           │
│ "Czy jest poniedziałek 9:00?" → Jeśli TAK → wykonuje task()    │
└─────────────────────────────────────────────────────────────────┘

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 7: BACKEND - Zwrot Odpowiedzi do Frontendu                │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/routes/cronRoutes.ts (linia 332-336)

res.json({
  message: 'Cron job created successfully',
  job: {
    id: 'job-xyz-789',
    name: 'Cotygodniowy raport sprzedaży',
    schedule: '0 9 * * 1',
    task_type: 'email',
    task_config: { ... },
    enabled: true,
    status: 'active',
    execution_count: 0,
    created_at: '2024-01-20T10:00:00Z'
  }
});

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 8: FRONTEND - Odbiera Odpowiedź i Aktualizuje UI          │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: frontend/app/tasks/page.tsx (linia 380-385)

if (response.ok) {
  // ✅ Sukces
  showToast('Zadanie utworzone', 'success');
  setShowModal(false);  // Zamknij modal
  resetForm();
  
  // 🔄 Odśwież listę zadań
  await fetchJobs();
  // → GET /api/cron/jobs
  // → Pobiera wszystkie joby z bazy
  // → setJobs([...nowe joby])
  // → React re-renderuje listę
}

┌─────────────────────────────────────────────────────────────────┐
│ 🎉 UI ZAKTUALIZOWANE - Nowe zadanie widoczne na liście!        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 PRZEPŁYW Z POWROTEM (Database → Backend → Frontend)

### PRZYKŁAD: Pobieranie Listy Zadań przy Załadowaniu Strony

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: useEffect(() => { fetchJobs(); }, [])                │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ GET /api/cron/jobs + JWT Token                                 │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE: authenticateUser sprawdza token                    │
│   → Wyciąga userId z tokenu                                    │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ ROUTES: GET /api/cron/jobs handler                             │
│   → Buduje query do bazy                                       │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: supabaseAdmin.from('cron_jobs')                      │
│   .select('*')                                                 │
│   .eq('user_id', userId)  // Tylko joby tego usera             │
│   .order('created_at', { ascending: false })                   │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE ZWRACA:                                               │
│ [                                                              │
│   {                                                            │
│     id: 'job-xyz-789',                                         │
│     name: 'Cotygodniowy raport sprzedaży',                     │
│     schedule: '0 9 * * 1',                                     │
│     task_type: 'email',                                        │
│     task_config: { recipient: 'boss@company.com', ... },       │
│     enabled: true,                                             │
│     status: 'active',                                          │
│     last_run: '2024-01-15T09:00:00Z',                          │
│     execution_count: 3,                                        │
│     created_at: '2024-01-01T10:00:00Z'                         │
│   },                                                           │
│   { /* więcej zadań */ }                                       │
│ ]                                                              │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ ROUTES: res.json({ jobs: data })                               │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: fetchJobs() otrzymuje dane                           │
│   → setJobs(response.data.jobs)                                │
│   → React re-renderuje komponent                               │
│   → UI pokazuje listę zadań z kartami                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⏰ AUTOMATYCZNE WYKONANIE (Cron Trigger)

### JAK node-cron AUTOMATYCZNIE URUCHAMIA ZADANIA?

```
┌─────────────────────────────────────────────────────────────────┐
│ 🕐 node-cron SPRAWDZA CO 1 MINUTĘ                              │
└─────────────────────────────────────────────────────────────────┘

Aktualna data/czas: Poniedziałek, 22 stycznia 2024, 09:00:00

node-cron iteruje przez wszystkie zarejestrowane tasks:

┌─────────────────────────────────────────────────────────────────┐
│ Task: job-xyz-789                                               │
│ Schedule: '0 9 * * 1'                                           │
│                                                                 │
│ Parsowanie cron expression:                                     │
│   0     = minuta 0                                              │
│   9     = godzina 9                                             │
│   *     = każdy dzień miesiąca                                  │
│   *     = każdy miesiąc                                         │
│   1     = poniedziałek (0=niedziela, 1=poniedziałek, ...)      │
│                                                                 │
│ Sprawdzenie:                                                    │
│   ✅ minuta = 0? TAK                                            │
│   ✅ godzina = 9? TAK                                           │
│   ✅ dzień tygodnia = 1 (poniedziałek)? TAK                     │
│                                                                 │
│ WYNIK: PASUJE! → WYKONAJ task()                                │
└─────────────────────────────────────────────────────────────────┘

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ WYKONANIE TASK():                                               │
│                                                                 │
│ console.log('⏰ Running scheduled job: job-xyz-789');           │
│                                                                 │
│ 1. Aktualizuj bazę:                                             │
│    UPDATE cron_jobs SET                                         │
│      last_run = NOW(),                                          │
│      execution_count = execution_count + 1,                     │
│      status = 'running'                                         │
│    WHERE id = 'job-xyz-789'                                     │
│                                                                 │
│ 2. Wykonaj akcję (zależnie od task_type):                      │
│    → EMAIL: Pobierz SMTP config → Wyślij email                 │
│    → PDF: Generuj dokument → Upload do Supabase Storage        │
│    → SCRAPING: Pobierz stronę → Ekstraktuj dane                │
│                                                                 │
│ 3. Stwórz notyfikację:                                          │
│    INSERT INTO notifications (                                  │
│      user_id, type, title, message, ...                         │
│    )                                                            │
│                                                                 │
│ 4. Zmień status z powrotem:                                     │
│    UPDATE cron_jobs SET status = 'active'                       │
│    WHERE id = 'job-xyz-789'                                     │
│                                                                 │
│ console.log('✅ Job job-xyz-789 completed');                    │
└─────────────────────────────────────────────────────────────────┘

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ 🔔 USER OTRZYMUJE NOTYFIKACJĘ                                  │
│                                                                 │
│ Frontend: useEffect(() => { fetchNotifications(); }, [])       │
│ → Pobiera nowe notyfikacje z bazy                              │
│ → Wyświetla toast: "Email wysłany: Raport tygodniowy"          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ⏰ NASTĘPNE WYKONANIE: Za tydzień (Poniedziałek, 09:00)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 PRZYKŁAD KROK PO KROKU - CODZIENNE GENEROWANIE PDF

### Scenariusz: User chce codziennie o 8:00 generować PDF z raportem

```javascript
// ═══════════════════════════════════════════════════════════════
// KROK 1: FRONTEND - User Wypełnia Formularz
// ═══════════════════════════════════════════════════════════════
// Plik: frontend/app/tasks/page.tsx

// User wpisuje:
const formData = {
  name: 'Codzienny raport PDF',
  task_type: 'pdf',
  scheduleType: 'recurring',
  recurringType: 'daily',
  scheduledTime: '08:00',
  task_config: {
    filename: 'daily_report.pdf',
    title: 'Raport Dzienny',
    content: 'Statystyki sprzedaży za ostatni dzień...',
    send_email: true,
    recipient: 'manager@company.com',
    email_subject: 'Twój raport dzienny jest gotowy'
  }
};

// Konwersja harmonogramu:
// recurringToCron('daily', '08:00') → '0 8 * * *'

// User klika "Utwórz zadanie"

// ═══════════════════════════════════════════════════════════════
// KROK 2: FRONTEND - Wysłanie do API
// ═══════════════════════════════════════════════════════════════

POST http://localhost:3001/api/cron/create
Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json
Body:
  {
    "name": "Codzienny raport PDF",
    "schedule": "0 8 * * *",  // Codziennie o 8:00
    "task_type": "pdf",
    "task_config": {
      "filename": "daily_report.pdf",
      "title": "Raport Dzienny",
      "content": "Statystyki sprzedaży...",
      "send_email": true,
      "recipient": "manager@company.com",
      "email_subject": "Twój raport dzienny jest gotowy"
    },
    "enabled": true
  }

// ═══════════════════════════════════════════════════════════════
// KROK 3: BACKEND - Zapisanie do Bazy
// ═══════════════════════════════════════════════════════════════
// Plik: backend/src/routes/cronRoutes.ts (linia 28-60)

const { data } = await supabaseAdmin.from('cron_jobs').insert({
  user_id: 'user-abc-123',
  name: 'Codzienny raport PDF',
  schedule: '0 8 * * *',
  task_type: 'pdf',
  task_config: { ... },
  enabled: true,
  status: 'pending'
});

// Baza zwraca: { id: 'job-pdf-456', ... }

// ═══════════════════════════════════════════════════════════════
// KROK 4: BACKEND - Uruchomienie Cron Job
// ═══════════════════════════════════════════════════════════════
// Plik: backend/src/routes/cronRoutes.ts (linia 159-248)

cronService.scheduleJob({
  name: 'job-pdf-456',
  schedule: '0 8 * * *',
  enabled: true,
  task: async () => {
    // ⏰ TO WYKONA SIĘ CODZIENNIE O 8:00
    
    console.log('📄 Generating daily PDF...');
    
    // 1. Aktualizuj bazę
    await supabaseAdmin.from('cron_jobs').update({
      last_run: NOW(),
      execution_count: execution_count + 1,
      status: 'running'
    }).eq('id', 'job-pdf-456');
    
    // 2. Generuj PDF (używając pdfkit)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    // Dodaj treść do PDF
    doc.fontSize(18).text('Raport Dzienny', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).text('Statystyki sprzedaży...');
    doc.end();
    
    // Czekaj na zakończenie generowania
    await new Promise(resolve => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(chunks);
    
    // 3. Upload do Supabase Storage
    const filepath = `user-abc-123/daily_report.pdf`;
    await supabaseAdmin.storage
      .from('generated-pdfs')
      .upload(filepath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    // 4. Wygeneruj signed URL (ważny 7 dni)
    const { data: urlData } = await supabaseAdmin.storage
      .from('generated-pdfs')
      .createSignedUrl(filepath, 604800);
    
    console.log('✅ PDF uploaded:', urlData.signedUrl);
    
    // 5. Wyślij email z linkiem (jeśli send_email = true)
    if (task_config.send_email) {
      const transporter = nodemailer.createTransport({ ... });
      
      await transporter.sendMail({
        to: 'manager@company.com',
        subject: 'Twój raport dzienny jest gotowy',
        html: `<p>PDF: <a href="${urlData.signedUrl}">Download</a></p>`
      });
      
      console.log('📧 Email sent with PDF link');
    }
    
    // 6. Stwórz notyfikację
    await createNotification(
      'user-abc-123',
      'pdf_generated',
      'PDF wygenerowany: Raport Dzienny',
      'Dokument został utworzony i wysłany emailem.'
    );
    
    // 7. Zmień status na active
    await supabaseAdmin.from('cron_jobs').update({
      status: 'active'
    }).eq('id', 'job-pdf-456');
  }
});

// ═══════════════════════════════════════════════════════════════
// KROK 5: AUTOMATYCZNE WYKONANIE - KAŻDEGO DNIA O 8:00
// ═══════════════════════════════════════════════════════════════

// Następnego dnia o 8:00:00
// node-cron sprawdza: "0 8 * * *" pasuje do aktualnego czasu?
// → TAK → Wykonuje task() funkcję z KROKU 4
// → Generuje PDF, uploaduje, wysyła email, tworzy notyfikację

// User otrzymuje:
// 1. 📧 Email z linkiem do PDF
// 2. 🔔 Notyfikację w aplikacji: "PDF wygenerowany"
// 3. 📊 Zaktualizowany execution_count w bazie (zwiększony o 1)

// I tak każdego dnia o 8:00! 🎉
```

---

## 📂 PLIKI I FUNKCJE - SZCZEGÓŁOWA MAPA

### FRONTEND

#### `frontend/app/tasks/page.tsx`
Główny komponent UI dla zaplanowanych zadań

**State Variables:**
- `jobs: CronJob[]` - Lista wszystkich zadań użytkownika
- `jobName: string` - Nazwa zadania (formularz)
- `scheduleType: 'once' | 'recurring'` - Typ harmonogramu
- `scheduledDate/Time: string` - Data/czas dla jednorazowych
- `recurringType: string` - Częstotliwość dla cyklicznych ('daily', 'weekly', etc.)
- `jobType: string` - Typ zadania ('email', 'pdf', 'scraping', 'custom')
- `jobConfig: string` - JSON config (różny dla każdego typu)

**Funkcje:**

```typescript
// 🔄 FETCH - Pobieranie danych z backendu
fetchJobs(): Promise<void>
  → GET /api/cron/jobs
  → routes/cronRoutes.ts (linia 343)
  → Pobiera listę zadań z bazy
  → setJobs(response.data.jobs)

// ➕ CREATE/UPDATE - Tworzenie lub edycja zadania
handleSaveJob(): Promise<void>
  → Konwertuje harmonogram na cron expression
  → POST /api/cron/create (nowe) lub PUT /api/cron/jobs/:id (edycja)
  → routes/cronRoutes.ts (linia 28 create, 406 update)
  → Wysyła: name, schedule, task_type, task_config
  → Backend zapisuje i uruchamia cron job
  → Odświeża listę: fetchJobs()

// ▶️ ⏸️ TOGGLE - Włącz/Wyłącz zadanie
handleToggleJob(job: CronJob): Promise<void>
  → POST /api/cron/jobs/:id/start lub /stop
  → routes/cronRoutes.ts (linia 489 start, 517 stop)
  → cronService.startJob() lub stopJob()
  → Aktualizuje enabled w bazie
  → Odświeża listę: fetchJobs()

// 🗑️ DELETE - Usuwanie zadania
handleDeleteJob(id: string): Promise<void>
  → confirm() - pytanie o potwierdzenie
  → DELETE /api/cron/jobs/:id
  → routes/cronRoutes.ts (linia 547)
  → cronService.stopJob() + usunięcie z bazy
  → Odświeża listę: fetchJobs()

// 🤖 AI - Generowanie konfiguracji z AI
generateConfig(): Promise<void>
  → POST /api/ai/generate
  → aiService generuje config JSON na podstawie typu zadania
  → Automatycznie wypełnia pole jobConfig
```

**Helper Functions:**

```typescript
// Konwersja daty/czasu na cron expression
dateToCron(date: string, time: string): string
  → "2024-01-20" + "09:00" → "0 9 20 1 *"

recurringToCron(type: string, time: string): string
  → "daily" + "09:00" → "0 9 * * *"
  → "weekly" + "09:00" → "0 9 * * 1"
  → "monthly" + "09:00" → "0 9 1 * *"

// Konwersja cron na czytelny format
cronToReadable(cron: string): string
  → "0 9 * * *" → "Codziennie o 9:00"
  → "0 9 * * 1" → "Każdy Poniedziałek o 9:00"
  → "0 9 1 * *" → "Co miesiąc 1-go o 9:00"
```

### BACKEND

#### `backend/src/routes/cronRoutes.ts`
Wszystkie endpointy API dla cron jobs

```typescript
// ➕ POST /api/cron/create (linia 28-336)
router.post('/create', authenticateUser, async (req, res) => {
  // 1. Waliduje dane (name, schedule, task_type)
  // 2. Zapisuje do bazy: cron_jobs table
  // 3. Tworzy task() funkcję (wysyłka email, PDF, scraping)
  // 4. Uruchamia: cronService.scheduleJob()
  // 5. Zwraca: { message: '...', job: {...} }
});

// 📋 GET /api/cron/jobs (linia 343-370)
router.get('/jobs', authenticateUser, async (req, res) => {
  // Pobiera listę jobs z bazy
  // Filtruje po user_id
  // Sortuje po created_at
  // Zwraca: { jobs: [] }
});

// 🔍 GET /api/cron/jobs/:id (linia 376-399)
router.get('/jobs/:id', authenticateUser, async (req, res) => {
  // Pobiera pojedynczy job
  // Sprawdza ownership (security)
  // Zwraca: { job: {...} }
});

// ✏️ PUT /api/cron/jobs/:id (linia 406-456)
router.put('/jobs/:id', authenticateUser, async (req, res) => {
  // Aktualizuje job (name, schedule, task_config)
  // Restartuje cron: stopJob() + scheduleJob()
  // Zwraca: { job: {...} }
});

// ▶️ POST /api/cron/jobs/:id/start (linia 489-514)
router.post('/jobs/:id/start', authenticateUser, async (req, res) => {
  // Uruchamia zatrzymany job
  // cronService.startJob(id)
  // Aktualizuje enabled=true w bazie
  // Zwraca: { message: 'Started' }
});

// ⏸️ POST /api/cron/jobs/:id/stop (linia 517-542)
router.post('/jobs/:id/stop', authenticateUser, async (req, res) => {
  // Zatrzymuje job (bez usuwania)
  // cronService.stopJob(id)
  // Aktualizuje enabled=false w bazie
  // Zwraca: { message: 'Stopped' }
});

// 🗑️ DELETE /api/cron/jobs/:id (linia 547-568)
router.delete('/jobs/:id', authenticateUser, async (req, res) => {
  // Zatrzymuje job: cronService.stopJob()
  // Usuwa z bazy: DELETE FROM cron_jobs
  // Zwraca: { message: 'Deleted' }
});
```

#### `backend/src/services/cronService.ts`
Zarządzanie cron jobs (node-cron wrapper)

```typescript
class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();
  
  // 📅 SCHEDULE JOB (linia 45-76)
  scheduleJob(config: CronJobConfig): void {
    // 1. Waliduje cron expression: cron.validate()
    // 2. Jeśli job istnieje → stopJob() (usuń stary)
    // 3. Tworzy node-cron task: cron.schedule(schedule, task)
    // 4. Zapisuje w Map: jobs.set(name, task)
    // 5. node-cron automatycznie uruchamia task() według schedule
    
    // PRZYKŁAD:
    // scheduleJob({
    //   name: 'job-123',
    //   schedule: '0 9 * * *',  // Codziennie o 9:00
    //   enabled: true,
    //   task: async () => {
    //     console.log('Wykonuję zadanie...');
    //     await sendEmail(...);
    //   }
    // });
  }
  
  // 🛑 STOP JOB (linia 93-99)
  stopJob(name: string): void {
    // Zatrzymuje i usuwa job z Map
    // job.stop() → jobs.delete(name)
  }
  
  // ▶️ START JOB (linia 113-118)
  startJob(name: string): void {
    // Włącza już istniejący (ale zatrzymany) job
    // job.start()
  }
  
  // 🛑 STOP ALL JOBS (linia 132-137)
  stopAllJobs(): void {
    // Zatrzymuje wszystkie jobs
    // Używane podczas graceful shutdown
  }
}
```

### DATABASE

#### Tabela: `cron_jobs`
Przechowuje definicje zaplanowanych zadań

```sql
CREATE TABLE cron_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- Nazwa zadania
  schedule TEXT NOT NULL,                 -- Cron expression (np. "0 9 * * 1")
  task_type TEXT NOT NULL,                -- 'email', 'pdf', 'scraping', 'custom'
  task_config JSONB DEFAULT '{}'::jsonb,  -- Config specyficzny dla typu
  enabled BOOLEAN DEFAULT true,           -- Czy job jest aktywny?
  status TEXT DEFAULT 'pending',          -- 'pending', 'active', 'running', 'stopped'
  last_run TIMESTAMPTZ,                   -- Ostatnie wykonanie
  execution_count INTEGER DEFAULT 0,      -- Ile razy wykonano
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Przykładowe rekordy:**

```json
{
  "id": "job-xyz-789",
  "user_id": "user-abc-123",
  "name": "Cotygodniowy raport sprzedaży",
  "schedule": "0 9 * * 1",
  "task_type": "email",
  "task_config": {
    "recipient": "boss@company.com",
    "subject": "Raport tygodniowy",
    "body": "Załączam raport..."
  },
  "enabled": true,
  "status": "active",
  "last_run": "2024-01-15T09:00:00Z",
  "execution_count": 3,
  "created_at": "2024-01-01T10:00:00Z"
}
```

---

## 🎯 PODSUMOWANIE KLUCZOWYCH KONCEPTÓW

### 1. **Cron Expression - Format Harmonogramu**
```
┌─────── minute (0-59)
│ ┌───── hour (0-23)
│ │ ┌─── day of month (1-31)
│ │ │ ┌─ month (1-12)
│ │ │ │ ┌ day of week (0-6, 0=Sunday)
│ │ │ │ │
* * * * *
```

**Przykłady:**
- `0 9 * * *` = Codziennie o 9:00
- `0 9 * * 1` = Każdy poniedziałek o 9:00
- `*/30 * * * *` = Co 30 minut
- `0 0 1 * *` = Pierwszego dnia miesiąca o północy

### 2. **Typy Zadań**
- **EMAIL**: Automatyczna wysyłka emaili (wymaga SMTP config)
- **PDF**: Generowanie dokumentów PDF + upload do Supabase Storage
- **SCRAPING**: Web scraping według harmonogramu
- **CUSTOM**: Niestandardowe zadania użytkownika

### 3. **Lifecycle Cron Job**
```
CREATE → SCHEDULE → AUTO-EXECUTE → UPDATE → NOTIFY
   ↓         ↓            ↓          ↓         ↓
 Baza   node-cron    Wykonaj     last_run  Notyfikacja
               ↓       task()      +count    dla usera
          Sprawdza
          co minutę
```

### 4. **Automatyczne Wykonanie**
- **node-cron** sprawdza co 1 minutę wszystkie zarejestrowane tasks
- Jeśli schedule pasuje do aktualnego czasu → wykonuje task()
- task() to funkcja przekazana z cronRoutes.ts
- Zawiera logikę: wysyłka email, generowanie PDF, scraping, etc.

### 5. **Zarządzanie Zadaniami**
- **CREATE**: POST /api/cron/create → zapisuje + uruchamia
- **START**: POST /api/cron/jobs/:id/start → włącza wykonywanie
- **STOP**: POST /api/cron/jobs/:id/stop → wyłącza (ale nie usuwa)
- **DELETE**: DELETE /api/cron/jobs/:id → usuwa z bazy + zatrzymuje
- **UPDATE**: PUT /api/cron/jobs/:id → edytuje + restartuje

### 6. **Przepływ Powrotny Taki Sam Wszędzie**
```
Service (cronService.scheduleJob)
  ↓ return success
Routes (res.json)
  ↓ HTTP response
API Client (fetch)
  ↓ response.data
Frontend (setJobs)
  ↓ React re-render
UI Update
```

---

## 📚 DODATKOWE ZASOBY

### Technologie:
- **node-cron**: https://github.com/node-cron/node-cron
- **Cron Expression**: https://crontab.guru/ (interaktywny generator)
- **PDFKit**: https://pdfkit.org/
- **Nodemailer**: https://nodemailer.com/
- **Supabase Storage**: https://supabase.com/docs/guides/storage

### Cron Expression Examples:
```
"*/5 * * * *"     - Co 5 minut
"0 */2 * * *"     - Co 2 godziny
"0 9-17 * * *"    - Co godzinę od 9:00 do 17:00
"0 9 * * 1-5"     - Dni robocze o 9:00
"0 0 * * 0"       - Każdą niedzielę o północy
"0 0 1,15 * *"    - 1-go i 15-go każdego miesiąca
```

---

**📝 Dokument stworzony jako kompletny przewodnik po systemie zaplanowanych zadań**  
**🎓 Przeznaczony do nauki i zrozumienia przepływu danych w systemie cron jobs**
