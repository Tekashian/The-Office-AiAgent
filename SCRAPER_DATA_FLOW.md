# 🌐 WEB SCRAPER - PEŁNY PRZEPŁYW DANYCH

## 📋 SPIS TREŚCI
1. [Architektura Systemu](#architektura-systemu)
2. [Przepływ TAM (Frontend → Backend → Database)](#przepływ-tam)
3. [Przepływ Z POWROTEM (Database → Backend → Frontend)](#przepływ-z-powrotem)
4. [Przykład Krok Po Kroku](#przykład-krok-po-kroku)
5. [Pliki i Funkcje](#pliki-i-funkcje)

---

## 🏗️ ARCHITEKTURA SYSTEMU

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  app/scraper/page.tsx                                      │ │
│  │  - UI: Formularz, Lista Jobs, History Modal               │ │
│  │  - State: jobs[], history[], selectedJob                  │ │
│  │  - Functions: fetchJobs(), createJob(), executeJob()      │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  lib/api.ts (apiClient - axios)                           │ │
│  │  - Request Interceptor: Dodaje JWT token                  │ │
│  │  - Response Interceptor: Obsługuje błędy (401, 500)       │ │
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
│  │  - Wyciąga userId z tokenu                                 │ │
│  │  - Dodaje req.userId do request                            │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  routes/scraperRoutes.ts                                   │ │
│  │  - GET    /api/scraper          (lista jobs)              │ │
│  │  - POST   /api/scraper/create   (utwórz job)              │ │
│  │  - POST   /api/scraper/:id/execute (wykonaj scraping)     │ │
│  │  - GET    /api/scraper/:id/history (historia)             │ │
│  │  - POST   /api/scraper/analyze  (AI analiza strony)       │ │
│  │  - DELETE /api/scraper/:id      (usuń job)                │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  services/scraperService.ts                                │ │
│  │  - scrapeWebPage()        (manual CSS selectors)          │ │
│  │  - scrapeWithAI()         (AI extraction)                 │ │
│  │  - analyzePageStructure() (AI analiza)                    │ │
│  │  Libraries: axios (HTTP), cheerio (HTML parsing)          │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
│                        │                                         │
│                        ▼ (tylko dla AI extraction)              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  services/aiService.ts                                     │ │
│  │  - sendRequest() → Google Gemini AI API                   │ │
│  │  - Wysyła HTML + prompt do AI                             │ │
│  │  - AI ekstraktuje dane i zwraca JSON                      │ │
│  └─────────────────────┬─────────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (Supabase PostgreSQL)              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  scrape_jobs                                               │ │
│  │  - id, user_id, name, url, extraction_type, selectors,    │ │
│  │    ai_prompt, status, result_data, execution_count        │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  scrape_history                                            │ │
│  │  - id, scrape_job_id, status, data_extracted,             │ │
│  │    executed_at, duration_ms, items_count                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 PRZEPŁYW TAM (Frontend → Backend → Database)

### PRZYKŁAD: User Klika "Execute" Button

```
┌─────────────────────────────────────────────────────────────────┐
│ KROK 1: FRONTEND - User Interaction                            │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: frontend/app/scraper/page.tsx (linia 241-269)

User klika przycisk "Execute" na karcie scraper job

┌─────────────────────────────────────────────────────────────────┐
│ const executeJob = async (jobId: string) => {                  │
│   setIsLoading(true);                                           │
│   try {                                                         │
│     const response = await apiClient.post(                     │
│       `/api/scraper/${jobId}/execute`  // 🎯 Endpoint          │
│     );                                                          │
│     // ... obsługa odpowiedzi                                  │
│   } catch (error) {                                             │
│     // ... obsługa błędów                                      │
│   }                                                             │
│ };                                                              │
└─────────────────────────────────────────────────────────────────┘

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 2: API CLIENT - Przygotowanie Requestu                    │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: frontend/lib/api.ts (linia 15-37)

apiClient.interceptors.request.use() automatycznie dodaje:

1️⃣ Pobiera JWT token z Supabase:
   const token = await getAccessToken();

2️⃣ Dodaje token do nagłówka:
   config.headers.Authorization = `Bearer ${token}`;

3️⃣ Wysyła request:
   POST http://localhost:3001/api/scraper/123/execute
   Headers:
     - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     - Content-Type: application/json

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 3: BACKEND - Middleware Auth                              │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/middleware/auth.ts (linia ~10-50)

authenticateUser middleware sprawdza request:

1️⃣ Wyciąga token z nagłówka:
   const token = req.headers.authorization?.split(' ')[1];

2️⃣ Weryfikuje token z Supabase:
   const { data: { user } } = await supabase.auth.getUser(token);

3️⃣ Dodaje userId do requestu:
   req.userId = user.id;

4️⃣ Przekazuje do następnego handler:
   next();

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 4: BACKEND - Route Handler (GŁÓWNA LOGIKA)                │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/routes/scraperRoutes.ts (linia 174-303)

POST /api/scraper/:id/execute handler:

1️⃣ Pobiera job z bazy:
   const { data: job } = await supabaseAdmin
     .from('scrape_jobs')
     .select('*')
     .eq('id', id)
     .eq('user_id', req.userId)  // 🔒 Security check
     .single();

2️⃣ Aktualizuje status na 'running':
   await supabaseAdmin
     .from('scrape_jobs')
     .update({ status: 'running' })
     .eq('id', id);

3️⃣ Decyduje o metodzie ekstrakcji:
   if (job.extraction_type === 'ai') {
     // ➡️ ŚCIEŻKA AI
     result = await scraperService.scrapeWithAI({ ... });
   } else {
     // ➡️ ŚCIEŻKA MANUAL
     result = await scraperService.scrapeWebPage({ ... });
   }

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 5A: SCRAPER SERVICE - Manual Extraction                   │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/services/scraperService.ts (linia 40-102)

scrapeWebPage(config):

1️⃣ Pobiera HTML strony:
   const response = await axios.get(config.url);

2️⃣ Parsuje HTML z cheerio:
   const $ = cheerio.load(response.data);

3️⃣ Ekstraktuje dane używając CSS selectors:
   Object.entries(config.selectors).forEach(([key, selector]) => {
     const elements = $(selector);
     result[key] = elements.text().trim();
   });

4️⃣ Zwraca wyekstraktowane dane:
   return { title: '...', price: '...', ... };

┌─────────────────────────────────────────────────────────────────┐
│ KROK 5B: SCRAPER SERVICE - AI Extraction                       │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/services/scraperService.ts (linia 104-176)

scrapeWithAI(config):

1️⃣ Pobiera HTML strony:
   const response = await axios.get(config.url);

2️⃣ Czyści HTML (usuwa <script>, <style>):
   $('script, style, noscript').remove();
   const textContent = $('body').text();

3️⃣ Wysyła do AI:
   const aiResponse = await this.aiService.sendRequest({
     prompt: `Extract: ${config.prompt}\n\nContent: ${textContent}`,
     temperature: 0.3,
     maxTokens: 2000
   });

                         ⬇️ (tylko dla AI)

┌─────────────────────────────────────────────────────────────────┐
│ KROK 6: AI SERVICE - Komunikacja z Gemini                      │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/services/aiService.ts (linia 85-152)

sendRequest(request):

1️⃣ Przygotowuje request dla Gemini:
   const requestBody = {
     contents: [{
       parts: [{ text: request.prompt }]
     }],
     generationConfig: {
       temperature: 0.3,
       maxOutputTokens: 2000
     }
   };

2️⃣ Wysyła do Gemini API:
   const response = await axios.post(this.apiUrl, requestBody, {
     headers: { 'x-goog-api-key': this.apiKey }
   });

3️⃣ Wyciąga odpowiedź:
   const text = response.data.candidates[0].content.parts[0].text;

4️⃣ Zwraca odpowiedź AI:
   return { content: text, model: 'gemini-2.5-flash' };

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 7: POWRÓT DO ROUTE HANDLER - Zapis do Bazy                │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/routes/scraperRoutes.ts (linia 239-287)

Po otrzymaniu wyniku (z manual lub AI):

1️⃣ Wykryj zmiany (jeśli enabled):
   if (job.change_detection) {
     changesDetected = detectChanges(job.last_data, result);
   }

2️⃣ Aktualizuj job w bazie:
   await supabaseAdmin
     .from('scrape_jobs')
     .update({
       status: 'completed',
       result_data: result,
       execution_count: (job.execution_count || 0) + 1
     })
     .eq('id', id);

3️⃣ Zapisz do historii:
   await supabaseAdmin
     .from('scrape_history')
     .insert({
       scrape_job_id: id,
       status: 'success',
       data_extracted: result,
       duration_ms: duration
     });

4️⃣ Wyślij notyfikację (jeśli zmiany):
   if (changeDetected) {
     await createNotification(...);
   }

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 8: ZWROT ODPOWIEDZI DO FRONTENDU                          │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: backend/src/routes/scraperRoutes.ts (linia 289-297)

res.json({
  message: 'Scraping completed successfully',
  result: {
    title: 'Extracted Title',
    price: '99.99',
    description: 'Product description...'
  },
  changeDetected: true,
  changes: { price: { old: '109.99', new: '99.99' } },
  duration_ms: 1234
});

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 9: API CLIENT - Response Interceptor                      │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: frontend/lib/api.ts (linia 41-68)

apiClient.interceptors.response.use() obsługuje odpowiedź:

1️⃣ Loguje odpowiedź:
   console.log('✅ API Response:', response.data);

2️⃣ Sprawdza status:
   - 200-299: Sukces → zwraca response
   - 401: Unauthorized → przekierowuje na /auth
   - 500: Server Error → throw error

3️⃣ Zwraca response.data do komponentu

                         ⬇️

┌─────────────────────────────────────────────────────────────────┐
│ KROK 10: FRONTEND - Aktualizacja UI                            │
└─────────────────────────────────────────────────────────────────┘

📍 PLIK: frontend/app/scraper/page.tsx (linia 245-265)

executeJob() otrzymuje odpowiedź:

1️⃣ Odświeża listę jobs:
   await fetchJobs();

2️⃣ Pokazuje toast notification:
   addToast({
     type: 'success',
     message: 'Scraping completed!',
     description: `Found ${result.items_count} items`
   });

3️⃣ Aktualizuje stan:
   setIsLoading(false);

4️⃣ UI re-renderuje się z nowymi danymi
```

---

## 🔄 PRZEPŁYW Z POWROTEM (Database → Backend → Frontend)

### PRZYKŁAD: Pobieranie Listy Jobs przy Załadowaniu Strony

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: useEffect(() => { fetchJobs(); }, [])                │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ API CLIENT: GET /api/scraper                                   │
│   + JWT Token w Authorization header                           │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE: authenticateUser sprawdza token                    │
│   → Wyciąga userId z tokenu                                    │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ ROUTES: GET /api/scraper handler                               │
│   → Buduje query do bazy                                       │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: supabaseAdmin.from('scrape_jobs')                    │
│   .select('*')                                                 │
│   .eq('user_id', req.userId)  // Tylko joby tego usera         │
│   .order('created_at', { ascending: false })                   │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE ZWRACA:                                               │
│ [                                                              │
│   {                                                            │
│     id: '123',                                                 │
│     name: 'Scrape Products',                                   │
│     url: 'https://example.com',                                │
│     status: 'completed',                                       │
│     result_data: { title: '...', price: '...' },               │
│     execution_count: 5,                                        │
│     created_at: '2024-01-20T10:00:00Z'                         │
│   }                                                            │
│ ]                                                              │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ ROUTES: res.json({ jobs: data, total: data.length })          │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ API CLIENT: Response interceptor loguje i zwraca dane         │
└─────────────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: fetchJobs() otrzymuje dane                           │
│   → setJobs(response.data.jobs)                                │
│   → React re-renderuje komponent                               │
│   → UI pokazuje listę jobs                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 PRZYKŁAD KROK PO KROKU - TWORZENIE NOWEGO JOBA

### Scenariusz: User chce stworzyć scraper dla cen produktów

```javascript
// ═══════════════════════════════════════════════════════════════
// KROK 1: FRONTEND - User wypełnia formularz
// ═══════════════════════════════════════════════════════════════
// Plik: frontend/app/scraper/page.tsx (linia 153-190)

// User wpisuje w formularzu:
const formData = {
  name: 'Monitor Price Tracker',
  url: 'https://shop.example.com/monitors',
  extraction_type: 'manual',
  selectors: {
    title: '.product-title',
    price: '.price-value',
    availability: '.stock-status'
  },
  schedule: '0 */6 * * *',  // Co 6 godzin
  enabled: true
};

// User klika "Create Job"
const handleCreateJob = async () => {
  await apiClient.post('/api/scraper/create', formData);
};

// ═══════════════════════════════════════════════════════════════
// KROK 2: API CLIENT - Dodaje JWT token
// ═══════════════════════════════════════════════════════════════
// Plik: frontend/lib/api.ts (linia 15-37)

// Interceptor automatycznie:
const token = await getAccessToken();  // Pobiera z Supabase
config.headers.Authorization = `Bearer ${token}`;

// Request HTTP:
POST http://localhost:3001/api/scraper/create
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body:
  {
    "name": "Monitor Price Tracker",
    "url": "https://shop.example.com/monitors",
    "extraction_type": "manual",
    "selectors": {
      "title": ".product-title",
      "price": ".price-value",
      "availability": ".stock-status"
    },
    "schedule": "0 */6 * * *",
    "enabled": true
  }

// ═══════════════════════════════════════════════════════════════
// KROK 3: BACKEND - Middleware sprawdza token
// ═══════════════════════════════════════════════════════════════
// Plik: backend/src/middleware/auth.ts

const token = req.headers.authorization.split(' ')[1];
const { data: { user } } = await supabase.auth.getUser(token);
req.userId = user.id;  // Dodaje userId = "abc-123-xyz"

// ═══════════════════════════════════════════════════════════════
// KROK 4: BACKEND - Route handler waliduje i zapisuje
// ═══════════════════════════════════════════════════════════════
// Plik: backend/src/routes/scraperRoutes.ts (linia 55-118)

// Walidacja:
if (!name || !url) throw Error('Missing required fields');
if (extraction_type === 'manual' && !selectors) throw Error('Need selectors');

// Zapis do bazy:
const { data, error } = await supabaseAdmin
  .from('scrape_jobs')
  .insert({
    user_id: 'abc-123-xyz',  // Z tokenu
    name: 'Monitor Price Tracker',
    url: 'https://shop.example.com/monitors',
    extraction_type: 'manual',
    selectors: {
      title: '.product-title',
      price: '.price-value',
      availability: '.stock-status'
    },
    schedule: '0 */6 * * *',
    enabled: true,
    status: 'scheduled',  // Bo ma schedule
    created_at: '2024-01-20T10:00:00Z',  // Auto
    execution_count: 0
  })
  .select()
  .single();

// ═══════════════════════════════════════════════════════════════
// KROK 5: DATABASE - PostgreSQL zapisuje rekord
// ═══════════════════════════════════════════════════════════════
// Tabela: scrape_jobs

// Nowy rekord w bazie:
{
  id: 'job-456',  // Auto-generated UUID
  user_id: 'abc-123-xyz',
  name: 'Monitor Price Tracker',
  url: 'https://shop.example.com/monitors',
  extraction_type: 'manual',
  selectors: { title: '.product-title', ... },
  schedule: '0 */6 * * *',
  enabled: true,
  status: 'scheduled',
  created_at: '2024-01-20T10:00:00Z',
  execution_count: 0,
  result_data: null
}

// ═══════════════════════════════════════════════════════════════
// KROK 6: BACKEND - Zwraca odpowiedź
// ═══════════════════════════════════════════════════════════════
// Plik: backend/src/routes/scraperRoutes.ts (linia 108-112)

res.json({
  message: 'Scrape job created successfully',
  job: {
    id: 'job-456',
    name: 'Monitor Price Tracker',
    url: 'https://shop.example.com/monitors',
    status: 'scheduled',
    // ... wszystkie pola z bazy
  }
});

// ═══════════════════════════════════════════════════════════════
// KROK 7: FRONTEND - Odbiera odpowiedź i aktualizuje UI
// ═══════════════════════════════════════════════════════════════
// Plik: frontend/app/scraper/page.tsx (linia 193-208)

const response = await apiClient.post('/api/scraper/create', formData);

// Dodaj nowy job do listy:
setJobs([...jobs, response.data.job]);

// Pokaż toast:
addToast({
  type: 'success',
  message: 'Job created!',
  description: 'Monitor Price Tracker has been created'
});

// Reset formularza:
setFormData({ name: '', url: '', ... });

// UI re-renderuje się - nowy job pojawia się na liście
```

---

## 📂 PLIKI I FUNKCJE - SZCZEGÓŁOWA MAPA

### FRONTEND

#### `frontend/app/scraper/page.tsx`
Główny komponent UI dla web scrapera

**State Variables:**
- `jobs: Job[]` - Lista wszystkich scraper jobs
- `history: ScraperHistory[]` - Historia wykonania wybranego joba
- `formData: JobFormData` - Dane formularza tworzenia joba
- `isLoading: boolean` - Stan ładowania
- `selectedJob: Job | null` - Wybrany job do wyświetlenia historii

**Funkcje:**

```typescript
// 🔄 FETCH - Pobieranie danych z backendu
fetchJobs(): Promise<void>
  → GET /api/scraper
  → routes/scraperRoutes.ts (linia 18)
  → Pobiera listę jobs z bazy
  → setJobs(response.data.jobs)

fetchHistory(jobId: string): Promise<void>
  → GET /api/scraper/:id/history
  → routes/scraperRoutes.ts (linia 305)
  → Pobiera historię wykonania
  → setHistory(response.data.history)

// ➕ CREATE - Tworzenie nowego joba
createJob(): Promise<void>
  → POST /api/scraper/create
  → routes/scraperRoutes.ts (linia 55)
  → Wysyła formData
  → Dodaje nowy job do listy

// 🚀 EXECUTE - Wykonanie scrapowania
executeJob(jobId: string): Promise<void>
  → POST /api/scraper/:id/execute
  → routes/scraperRoutes.ts (linia 174)
  → scraperService.scrapeWebPage() lub scrapeWithAI()
  → Wyświetla wyniki w toast

// 🤖 AI ANALYZE - Analiza strony z AI
analyzeUrl(): Promise<void>
  → POST /api/scraper/analyze
  → routes/scraperRoutes.ts (linia 469)
  → scraperService.analyzePageStructure()
  → Automatycznie wypełnia selektory

// 🗑️ DELETE - Usuwanie joba
deleteJob(jobId: string): Promise<void>
  → DELETE /api/scraper/:id
  → routes/scraperRoutes.ts (linia 351)
  → Usuwa z bazy
  → Usuwa z listy jobs

// 🔄 TOGGLE - Włącz/Wyłącz job
toggleJobEnabled(jobId: string): Promise<void>
  → PUT /api/scraper/:id
  → routes/scraperRoutes.ts (linia 120)
  → Aktualizuje pole enabled
```

#### `frontend/lib/api.ts`
Axios client z interceptorami

```typescript
// 📤 REQUEST INTERCEPTOR
apiClient.interceptors.request.use()
  → Pobiera JWT token: getAccessToken()
  → Dodaje do nagłówka: Authorization: Bearer <token>
  → Loguje request

// 📥 RESPONSE INTERCEPTOR
apiClient.interceptors.response.use()
  → Loguje odpowiedź
  → Obsługuje błędy:
    * 401 → Przekierowanie na /auth
    * 500 → Throw error
  → Zwraca response.data
```

### BACKEND

#### `backend/src/routes/scraperRoutes.ts`
Wszystkie endpointy API dla scrapera

```typescript
// 📋 GET /api/scraper (linia 18-49)
router.get('/', authenticateUser, async (req, res) => {
  // Pobiera listę jobs z bazy
  // Filtruje po user_id (z JWT token)
  // Sortuje po created_at (najnowsze na górze)
  // Zwraca: { jobs: [], total: 0 }
});

// ➕ POST /api/scraper/create (linia 55-118)
router.post('/create', authenticateUser, async (req, res) => {
  // Waliduje dane (name, url, selectors/ai_prompt)
  // Zapisuje do scrape_jobs table
  // Zwraca: { message: '...', job: {...} }
});

// 🚀 POST /api/scraper/:id/execute (linia 174-303)
router.post('/:id/execute', authenticateUser, async (req, res) => {
  // Pobiera job z bazy
  // Wybiera metodę: scrapeWebPage() lub scrapeWithAI()
  // Wykrywa zmiany (change_detection)
  // Zapisuje wyniki do scrape_jobs i scrape_history
  // Wysyła notyfikację (jeśli zmiany)
  // Zwraca: { result: {...}, changeDetected: bool, duration_ms: 0 }
});

// 📜 GET /api/scraper/:id/history (linia 305-335)
router.get('/:id/history', authenticateUser, async (req, res) => {
  // Sprawdza ownership (security)
  // Pobiera z scrape_history table
  // Sortuje po executed_at
  // Zwraca: { history: [] }
});

// 🤖 POST /api/scraper/analyze (linia 469-493)
router.post('/analyze', authenticateUser, async (req, res) => {
  // Wywołuje scraperService.analyzePageStructure()
  // AI analizuje strukturę strony
  // Sugeruje CSS selektory
  // Zwraca: { analysis: {...} }
});

// 🗑️ DELETE /api/scraper/:id (linia 351-367)
router.delete('/:id', authenticateUser, async (req, res) => {
  // Usuwa job z scrape_jobs table
  // CASCADE usuwa także scrape_history
  // Zwraca: { message: 'Deleted successfully' }
});

// ✏️ PUT /api/scraper/:id (linia 120-145)
router.put('/:id', authenticateUser, async (req, res) => {
  // Aktualizuje job (enabled, name, url, etc.)
  // Zwraca: { message: 'Updated', job: {...} }
});
```

#### `backend/src/services/scraperService.ts`
Główna logika scrapowania

```typescript
class ScraperService {
  
  // 🛠️ MANUAL EXTRACTION (linia 40-102)
  async scrapeWebPage(config: ScrapingConfig): Promise<any> {
    // 1. axios.get(url) - Pobiera HTML
    // 2. cheerio.load(html) - Parsuje HTML
    // 3. $(selector) - Wyciąga dane CSS selectors
    // 4. Zwraca: { title: '...', price: '...', ... }
    
    // PRZYKŁAD:
    // Input: { url: '...', selectors: { title: '.product-title' } }
    // Output: { title: 'Product Name' }
  }

  // 🤖 AI EXTRACTION (linia 104-176)
  async scrapeWithAI(config): Promise<any> {
    // 1. axios.get(url) - Pobiera HTML
    // 2. cheerio - Czyści HTML (usuwa <script>, <style>)
    // 3. aiService.sendRequest() - Wysyła do Gemini
    // 4. Gemini ekstraktuje dane według promptu
    // 5. Parsuje JSON z odpowiedzi AI
    // 6. Zwraca: { title: '...', price: '...', ... }
    
    // PRZYKŁAD:
    // Input: { url: '...', prompt: 'Extract product name and price' }
    // Output: { name: 'Product', price: '99.99' }
  }

  // 🔍 AI ANALYSIS (linia 178-268)
  async analyzePageStructure(url: string): Promise<any> {
    // 1. axios.get(url) - Pobiera HTML
    // 2. cheerio - Analizuje strukturę:
    //    - Tytuł, headings, liczba linków/obrazków
    //    - Potencjalne data containers (.product, .item, .card)
    // 3. Wyciąga sample content (pierwsze 3 elementy)
    // 4. aiService.sendRequest() - Wysyła do Gemini
    // 5. AI sugeruje:
    //    - Typ danych (products, articles, jobs)
    //    - Rekomendowane CSS selektory
    //    - Strategię ekstrakcji (manual vs AI)
    // 6. Zwraca pełną analizę
    
    // PRZYKŁAD OUTPUT:
    // {
    //   title: 'Shop Page',
    //   suggestedContainers: [
    //     { selector: '.product', count: 24 }
    //   ],
    //   aiSuggestions: {
    //     dataType: 'E-commerce products',
    //     selectors: { title: '.product h3', price: '.price' }
    //   }
    // }
  }
}
```

#### `backend/src/services/aiService.ts`
Komunikacja z Google Gemini AI

```typescript
class AIService {
  
  // 📤 SEND REQUEST (linia 85-152)
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    // 1. Waliduje credentials (API key, URL)
    // 2. Przygotowuje request body:
    //    { contents: [{ parts: [{ text: prompt }] }] }
    // 3. axios.post(GEMINI_API_URL, body, {
    //      headers: { 'x-goog-api-key': apiKey }
    //    })
    // 4. Sprawdza safety filters
    // 5. Wyciąga odpowiedź:
    //    response.candidates[0].content.parts[0].text
    // 6. Zwraca: { content: '...', model: '...', tokensUsed: 0 }
    
    // PRZYKŁAD:
    // Input: { prompt: 'Extract X from Y', temperature: 0.3 }
    // Output: { content: '{"x": "value"}', tokensUsed: 156 }
  }

  // 👤 GET USER CONTEXT (linia 22-80)
  async getUserContext(userId: string): Promise<string> {
    // Pobiera kontekst użytkownika z bazy
    // Używany do personalizacji odpowiedzi AI
    // Zwraca sformatowany string z danymi usera
  }
}
```

### DATABASE

#### Tabela: `scrape_jobs`
Przechowuje definicje scraper jobs

```sql
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  extraction_type TEXT DEFAULT 'manual',  -- 'manual', 'ai', 'hybrid'
  selectors JSONB DEFAULT '{}'::jsonb,   -- CSS selectors dla manual
  ai_prompt TEXT,                         -- Prompt dla AI extraction
  schedule TEXT,                          -- Cron expression
  enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending',          -- 'pending', 'running', 'completed', 'failed'
  result_data JSONB,                      -- Ostatnie wyniki
  last_data JSONB,                        -- Do wykrywania zmian
  change_detection BOOLEAN DEFAULT false,
  alert_config JSONB DEFAULT '{}'::jsonb,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_run TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

#### Tabela: `scrape_history`
Historia wykonania scraper jobs

```sql
CREATE TABLE scrape_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scrape_job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                   -- 'success', 'failed'
  data_extracted JSONB,                   -- Wyekstraktowane dane
  changes_detected JSONB,                 -- Wykryte zmiany
  error_message TEXT,                     -- Błąd (jeśli failed)
  items_count INTEGER,                    -- Liczba wyekstraktowanych elementów
  duration_ms INTEGER,                    -- Czas wykonania w ms
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 PODSUMOWANIE KLUCZOWYCH KONCEPTÓW

### 1. **Dwukierunkowy Przepływ Danych**
```
FRONTEND ⟷ API CLIENT ⟷ ROUTES ⟷ SERVICES ⟷ DATABASE
```

### 2. **Dwa Tryby Ekstrakcji**
- **Manual (CSS Selectors)**: Szybkie, precyzyjne, wymaga znajomości HTML
- **AI (Natural Language)**: Elastyczne, wolniejsze, kosztowne

### 3. **Security przez Cały Stack**
- JWT token weryfikowany na każdym kroku
- Filtrowanie po `user_id` w wszystkich zapytaniach do bazy
- Middleware `authenticateUser` przed każdym endpoint

### 4. **Separacja Odpowiedzialności**
- **Frontend**: UI, state management, user interaction
- **API Client**: HTTP communication, token management
- **Routes**: Request handling, validation, orchestration
- **Services**: Business logic, external APIs, data processing
- **Database**: Data persistence, relationships

### 5. **Asynchroniczność**
- Wszystkie operacje IO są async/await
- Frontend czeka na odpowiedź przed aktualizacją UI
- Backend może wykonywać długie operacje (scraping, AI)

---

## 📚 DODATKOWE ZASOBY

### Technologie:
- **Next.js**: https://nextjs.org/docs
- **Express**: https://expressjs.com/
- **Cheerio**: https://cheerio.js.org/
- **Axios**: https://axios-http.com/
- **Supabase**: https://supabase.com/docs
- **Google Gemini**: https://ai.google.dev/docs

### CSS Selectors:
- `.class` - Element z klasą
- `#id` - Element z ID
- `div > p` - Bezpośrednie dziecko
- `[attr="value"]` - Atrybut z wartością
- `:nth-child(n)` - N-te dziecko

### Cron Expressions:
- `* * * * *` - Co minutę
- `0 * * * *` - Co godzinę
- `0 */6 * * *` - Co 6 godzin
- `0 0 * * *` - Codziennie o północy
- `0 9 * * 1` - Każdy poniedziałek o 9:00

---

**📝 Dokument stworzony jako kompletny przewodnik po systemie Web Scraper**  
**🎓 Przeznaczony do nauki i zrozumienia przepływu danych w pełnym stack aplikacji**
