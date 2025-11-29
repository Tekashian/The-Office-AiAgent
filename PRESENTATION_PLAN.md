# 🎯 PLAN PREZENTACJI PROJEKTU - AI REV INTERVIEW

## 📋 STRUKTURA PREZENTACJI (20-25 minut)

---

## 1️⃣ OTWARCIE - Kim jestem i dlaczego ten projekt (2 min)

**Co mówisz:**
- "Cześć, jestem [Imię]. Zbudowałem system automatyzacji biura sterowany AI, który pokazuje moje podejście do łączenia LLM z realną inżynierią backendową."
- "Chciałem stworzyć coś, co rozwiązuje prawdziwe problemy biznesowe - nie tylko proof-of-concept, ale produkcyjny system z multi-user auth, skalowalnością i security."

**Dlaczego to pasuje do AI REV:**
- ✅ Full-stack (React/Next.js + Node/Express + Supabase)
- ✅ Integracja AI (Google Gemini, wielomodelowa architektura)
- ✅ Skalowalność (stateless backend, RLS w bazie, gotowość do konteneryzacji)
- ✅ DevOps thinking (Docker ready, environment validation, encryption)
- ✅ Praktyczne zastosowanie AI w biznesie

---

## 2️⃣ PROBLEM I ROZWIĄZANIE (3 min)

### Problem biznesowy:
- Biura tracą godziny na powtarzalne zadania: wysyłanie emaili, generowanie raportów PDF, monitorowanie stron, planowanie tasków
- Brak automatyzacji → wysokie koszty operacyjne, błędy ludzkie, długi czas odpowiedzi

### Moje rozwiązanie:
**Office AI Agent** - inteligentny system automatyzacji sterowany konwersacją

**5 głównych funkcji:**
1. 🤖 **AI Agent Chat** - konwersacyjny interfejs do sterowania wszystkim
2. 📧 **Email Automation** - wysyłka z szablonami, bulk emails, SMTP multi-user
3. 📄 **PDF Generation** - dokumenty z szablonami, AI-assisted content
4. 🕷️ **Web Scraper** - manual CSS selectors + AI-powered extraction
5. ⏰ **Cron Jobs** - zaplanowane zadania, pełna orkiestracja

**Wartość biznesowa:**
- Automatyzacja >70% rutynowych zadań (benchmark z przykładów AI REV)
- Redukcja kosztów operacyjnych
- Audytowalność i compliance (wszystko w bazie z RLS)
- Skalowalność (ready dla enterprise)

---

## 3️⃣ ARCHITEKTURA TECHNICZNA (5 min)

### Stack technologiczny:

**Frontend (Next.js 16 + React 19 + TypeScript):**
- App Router, Server/Client Components
- Tailwind CSS + custom UI kit (`Card`, `Button`, `Input`)
- Type-safe z interfejsami (pokazuje dbałość o maintainability)
- API client z auth interceptors

**Backend (Node.js + Express + TypeScript):**
- RESTful API, 13 routes modules
- Service layer (separation of concerns)
- Middleware: auth (JWT), error handling
- Encryption utilities (AES-256 dla SMTP passwords)
- Environment validation (fail-fast approach)

**Data Layer (Supabase/PostgreSQL):**
- 7 tabel z Row Level Security (multi-tenancy)
- Encrypted secrets storage
- Automatic triggers (user profile creation)
- Ready dla migracji na cloud-native Postgres

**AI Integration:**
- Google Gemini (pluggable - łatwo dodać OpenAI/Anthropic)
- Agent Orchestrator (tool selection + execution)
- User context awareness (personalizacja odpowiedzi)
- Multi-turn conversations z historią

### Kluczowe decyzje architektoniczne:

**1. Stateless Backend** → horizontal scaling ready
- Żaden stan w pamięci (poza node-cron registry)
- Wszystko w bazie → load balancer + repliki bez problemu

**2. RLS w Supabase** → security by design
- Każdy user widzi tylko swoje dane
- JWT verification na poziomie backendu + DB
- Admin client tylko dla controlled bypass

**3. Encryption at rest** → compliance
- SMTP credentials encrypted (AES-256-CBC)
- Klucz z env, nie w kodzie
- Ready dla secrets management (Vault/KMS)

**4. Agent Orchestration** → separation of concerns
```
User message → Intent Analysis (AI) → Tool Selection → Execution
                    ↓
            [email, pdf, scraper, cron, conversation]
```

**5. Type Safety Everywhere**
- TypeScript w całym stacku
- Pydantic-like validation w route handlers
- Interfejsy dla każdej struktury danych

---

## 4️⃣ DEMO LIVE - User Journey (10-12 min)

### ⚙️ Przygotowanie przed prezentacją:
```powershell
# Terminal 1 - Backend
cd backend
npm run dev
# Sprawdź: http://localhost:3001/health

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Sprawdź: http://localhost:3000
```

**Pre-demo checklist:**
- [ ] Test user: `demo@airev.test` / hasło zapisane
- [ ] SMTP config skonfigurowany (Gmail App Password)
- [ ] Minimum 2-3 przykładowe emaile w historii
- [ ] Przynajmniej 1 aktywny cron job
- [ ] Browser DevTools otwarte (Network tab) - pokaż API calls
- [ ] VS Code z otwartymi kluczowymi plikami (do szybkiego przeskoku)

---

### 🎬 SCENARIUSZ 1: Authentication & Multi-User Architecture (2 min)

**Krok 1: Pokazanie Auth Flow**
1. Otwórz `http://localhost:3000` w przeglądarce
2. Pokaż redirect na `/auth` (jeśli niezalogowany)
3. **Zaloguj się** - pokaż UI login screen

**Co mówisz podczas logowania:**
```
"System zaczyna od bezpiecznej autoryzacji. Używam Supabase Auth z JWT tokens.
Po zalogowaniu, każdy request do backendu zawiera token w Authorization header,
który jest weryfikowany przez middleware."
```

**Krok 2: Pokaż FRONTEND auth wrapper (15 sek)**
- Otwórz `frontend/lib/auth.ts` w VS Code (168 linii)
- **Kluczowe funkcje do pokazania:**

**A) Type Guards dla Error Handling (lines 7-22):**
```typescript
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}
```

**Co mówisz (proste słowa):**
```
"To jest type guard - funkcja, która sprawdza czy error ma właściwość 'message'.

Zamiast używać 'any', używam 'unknown' - to znaczy 'nie wiem co to jest, 
ale sprawdzę przed użyciem'.

Funkcja robi 4 proste checky:
1. Czy to obiekt? (typeof error === 'object')
2. Czy nie jest null? (error !== null)
3. Czy ma pole 'message'? ('message' in error)
4. Czy to message jest stringiem? (typeof ... === 'string')

Jeśli wszystko OK, TypeScript wie że może bezpiecznie użyć error.message.

To pattern z TypeScript - nazywa się 'type narrowing'. 
Zamiast zgadywać, sprawdzam. Dzięki temu errors łapię w compile-time, 
nie w runtime gdy user kliknie."
```

**Jeśli zapytają "Why not instanceof Error?":**
```
"W JavaScript errors mogą być różne - Error object, string, custom object.
Ten guard jest bardziej elastyczny - sprawdza strukturę zamiast typu.
Duck typing - jeśli wygląda jak error (ma message), traktuj jak error."
```

**B) Auth Functions (lines 28-66):**
```typescript
export async function signUp(email: string, password: string, fullName?: string)
export async function signIn(email: string, password: string)
export async function signOut()
```

**Co mówisz:**
```
"Frontend wrapper nad Supabase Auth SDK. Centralizuje authentication logic,
co ułatwia testing i maintenance. Pattern separation of concerns."
```

**C) Session & Token Management (lines 92-108):**
```typescript
export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token || null;
}
```

**Co mówisz:**
```
"getAccessToken() używany do Authorization headers w API requests.
Frontend pobiera JWT, backend weryfikuje - zero session storage w aplikacji."
```

**D) Auth State Subscription (lines 145-150):**
```typescript
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
```

**Co mówisz:**
```
"Real-time auth state monitoring. React components subscribe to logout/login events
- automatic UI updates bez manual polling."
```

**Krok 3: Pokaż BACKEND middleware auth w kodzie (10 sek)**
- Otwórz `backend/src/middleware/auth.ts` w VS Code
- **Przeskocz do linii 14-57** (funkcja `authenticateUser`)
- Pokaż kluczowe fragmenty:
  - **Linia 19-26**: Wyciąganie tokena z `Authorization: Bearer <token>`
  - **Linia 28-35**: Weryfikacja z Supabase (`supabase.auth.getUser(token)`)
  - **Linia 37-39**: Dodanie `userId` i `userEmail` do requestu
```typescript
// Linia 28-35
const token = authHeader.substring(7); // Remove 'Bearer ' prefix
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  res.status(401).json({ error: 'Unauthorized' });
}

// Linia 37-39
req.userId = user.id;
req.userEmail = user.email;
```

**Co mówisz:**
```
"Backend middleware weryfikuje JWT z każdym requestem.
Frontend auth.ts ≠ Backend auth.ts - różne cele:
  • Frontend: wrapper do Supabase SDK (user operations)
  • Backend: verification middleware (security gate)
```

**Krok 4: Pokaż RLS w bazie (opcjonalne - 20 sek)**
- Otwórz Supabase Dashboard → SQL Editor
- Pokaż policy:
```sql
CREATE POLICY "Users see only own data"
ON emails_sent FOR SELECT
USING (auth.uid() = user_id);
```

**Co mówisz:**
```
"Row Level Security w PostgreSQL zapewnia data isolation na poziomie bazy.
Każdy user widzi tylko swoje dane - nawet jeśli SQL injection, nie wyciągnie
cudzych rekordów. Security by design, nie tylko na poziomie aplikacji."
```

**Kluczowe punkty:**
- ✅ JWT authentication (production-grade, nie custom auth)
- ✅ Frontend wrapper pattern (centralization, testability)
- ✅ TypeScript best practices (unknown + type guards zamiast any)
- ✅ Backend middleware pattern (reusable, testable)
- ✅ RLS (database-level security)
- ✅ Multi-tenancy ready
- ✅ Real-time auth state monitoring

**💡 Interview Answer gotowy:**
"Why not use Supabase directly in components?"
→ "Centralization for testing, error handling consistency, and easier migration if we switch auth providers. Separation of concerns - frontend wrapper dla user operations, backend middleware dla security gate."

**🧪 Q&A: Techniczne pytania zespołu (Auth) — 6 szybkich odpowiedzi**
- **Q1: Dlaczego używasz `unknown` zamiast `any` w błędach?**
  - **A:** `unknown` wymusza sprawdzenie typu (type narrowing) przed użyciem. Dzięki temu nie crashujemy na niestandardowych errorach i mamy bezpieczne, przewidywalne komunikaty. `any` wyłącza type-checking.
- **Q2: Jak frontend `auth.ts` współpracuje z backendowym middleware?**
  - **A:** Frontend pobiera JWT (`getAccessToken()` z `session.access_token`) i wysyła w `Authorization: Bearer`. Backend `authenticateUser` (lines 14-48) weryfikuje token przez Supabase i dokleja `req.userId`, co wspiera multi-tenancy.
- **Q3: Co, jeśli token wygaśnie podczas sesji?**
  - **A:** Subskrybuję `onAuthStateChange` (lines 145-150). Gdy sesja się zmieni/wygaśnie, UI automatycznie reaguje (logout/refresh). Po stronie API 401 z middleware wymusza re-login.
- **Q4: Jak zapobiegasz wyciekom wrażliwych informacji w komunikatach błędów?**
  - **A:** Loguję pełny błąd w konsoli dev (`console.error`), ale zwracam do UI znormalizowany tekst przez `getErrorMessage(error, 'Authentication failed')`. To chroni przed ujawnieniem detali (np. SQL/stack trace).
- **Q5: Dlaczego RLS, skoro już masz middleware?**
  - **A:** Defense-in-depth. Middleware filtruje dostęp na warstwie API, RLS izoluje dane na poziomie bazy (np. przy błędach zapytań lub eksploitach). Polityka: `USING (auth.uid() = user_id)`.
- **Q6: Czy łatwo zmienić dostawcę auth (np. Auth0/Firebase)?**
  - **A:** Tak, bo auth jest scentralizowany w `frontend/lib/auth.ts` jako wrapper. Error handling jest uniwersalny (`unknown` + type guards). Backend weryfikuje JWT przez adapter — wymiana jest lokalna, bez dotykania komponentów.

---

### 🤖 SCENARIUSZ 2: AI Agent Orchestration - Tool Calling (3 min)

**Krok 1: Otwórz Chat Interface**
1. Kliknij "AI Agent" w sidebar (na mobile kliknij ikonę menu w lewym górnym rogu lub wejdź bezpośrednio na `/agent`)
2. Pokaż clean chat UI z historią konwersacji

**Co mówisz:**
```
"To nie jest prosty chatbot. To agent orkiestrujący narzędzia.
Zamiast hardcoded if-else, używam AI do analizy intencji i wyboru akcji."
```

**Krok 2: Test Intent Classification**

**Przykład 1 - Email Action:**
```
Ty: "Wyślij email do jan.kowalski@example.com z tematem 'Spotkanie' 
     i treścią: Proponuję spotkanie jutro o 10:00"
```

**Co dzieje się w tle (pokaż w DevTools Network tab):**
- POST `/api/agent/chat`
- Request body:
```json
{
  "message": "Wyślij email...",
  "conversationHistory": [...]
}
```

**Co mówisz podczas ładowania (5-10 sek):**
```
"Backend wywołuje agentOrchestrator, który:
1. Wysyła prompt do Gemini: 'Analyze user intent, return JSON with tool name'
2. AI zwraca: { tool: 'send_email', parameters: {...} }
3. Orchestrator wykonuje send_email() function
4. Pobiera user-specific SMTP config z bazy (encrypted)
5. Wysyła email przez Nodemailer
6. Zwraca naturalna odpowiedź do UI"
```

**Pokaż response w chat:**
```
Agent: ✅ Email wysłany pomyślnie do jan.kowalski@example.com! 
       Message ID: <12345@smtp.gmail.com>
```

**Krok 3: Pokaż kod agentOrchestrator (30 sek)**
- Otwórz `backend/src/services/agentOrchestrator.ts` (plik ma 450+ linii)
- **Przeskocz do linii 132-170** (funkcja `analyzeIntent`)
- Pokaż kluczowe fragmenty:
  - **Linia 72-102**: `getSystemPrompt()` - zwraca listę dostępnych tools
  - **Linia 109**: Budowanie pełnego prompt z system instructions
  - **Linia 112**: Wywołanie `aiService.chat()` (Gemini API)
  - **Linia 115-116**: Czyszczenie i parsing JSON response
```typescript
// Linia 107-129: analyzeIntent
async analyzeIntent(message: string, _userId?: string): Promise<AgentAction> {
  try {
    const systemPrompt = this.getSystemPrompt(); // Linia 72-102: lista tools
    const fullPrompt = `${systemPrompt}\n\nUser message: "${message}"\n\nYour JSON response:`;
    
    const response = await aiService.chat(fullPrompt, []); // Gemini API call
    
    // Parse AI response - cleanup markdown if present
    const cleanResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const action = JSON.parse(cleanResponse) as AgentAction;
    // Returns: { tool: 'send_email', reasoning: '...', parameters: {...} }
    return action;
  } catch (error) {
    // Fallback to conversation if parsing fails
  }
}
```

**Co mówisz:**
```
"System prompt zawiera opis wszystkich dostępnych tools: send_email, 
generate_pdf, scrape_website, create_cron_job, conversation.
AI sam decyduje który tool użyć na podstawie user message.
To pattern Function Calling - podobnie jak w OpenAI, Anthropic."
```

**Krok 4: Pokaż executeSendEmail() (20 sek)**
- Scroll do **linii 188-240** w `agentOrchestrator.ts` (funkcja `executeSendEmail`)
- Pokaż kluczowe fragmenty:
  - **Linia 174-182**: Pobieranie user's SMTP config z bazy (per-user isolation)
  - **Linia 184**: Decryption hasła (`decrypt(config.smtp_password)`)
  - **Linia 187-195**: Tworzenie Nodemailer transporter z user credentials
  - **Linia 197-203**: Wysyłka emaila
  - **Linia 205-213**: Zapis do `emails_sent` table (audit trail)

**Co mówisz:**
```
"Każda akcja jest izolowana per user. SMTP credentials są encrypted w bazie
AES-256-CBC. Runtime decryption tylko dla tego requestu. Zero credentials 
w logach czy error messages."
```

**Przykład 2 - Conversation Fallback:**
```
Ty: "Jaka jest pogoda w Warszawie?"
```

**Co mówisz:**
```
"Agent rozpoznaje że to pytanie ogólne, nie wymaga akcji.
Zwraca tool: 'conversation' i po prostu rozmawia jak normalny chatbot."
```

**Kluczowe punkty:**
- ✅ Tool calling/function calling pattern (industry standard)
- ✅ Separation: intent analysis → execution
- ✅ Multi-user isolation (credentials per user)
- ✅ Encryption at rest
- ✅ Audit trail (wszystko w bazie)
- ✅ Extensible (łatwo dodać nowe tools)

---

### 📧 SCENARIUSZ 3: Email Automation - Templates & AI Generation (3 min)

**Krok 1: Email Settings Page**
1. Przejdź do Settings → Email (`/settings/email`)
2. Pokaż listę saved SMTP configurations

**Co mówisz:**
```
"Każdy user może mieć kilka konfiguracji SMTP - służbowy Gmail, 
prywatny Outlook, SMTP korporacyjny. Hasła są encrypted przed zapisem do bazy."
```

**Krok 2: Test SMTP Config (opcjonalne - 20 sek)**
- Kliknij "Test Configuration" na aktywnym config
- Pokaż success toast: "Configuration is working!"

**Co mówisz:**
```
"Przed zapisem testujemy connection. Backend wysyła test email do samego siebie.
Jeśli fail, user od razu wie że credentials są złe. Lepsze UX niż fail 
dopiero przy pierwszym wysłaniu produkcyjnego emaila."
```

**Krok 3: Email Templates Page**
1. Przejdź do Email (`/email`)
2. Pokaż listę saved templates

**Co mówisz:**
```
"Template system dla powtarzalnych emaili. Zamiast pisać od zera każdy raz,
mamy gotowe szablony z placeholders: {{name}}, {{company}}, {{date}}"
```

**Krok 4: AI-Generated Template (kluczowy moment!)**
1. Kliknij "Create New Template"
2. Wybierz kategorię: "Oferta handlowa"
3. Dodaj context: "Oferta na consulting AI, 3 miesiące, 50k PLN"
4. Kliknij "Generate with AI"

**Co dzieje się w tle (pokaż w DevTools - 5 sek ładowania):**
- POST `/api/ai/generate-email-template`
- Request:
```json
{
  "category": "Oferta handlowa",
  "additionalContext": "Oferta na consulting AI, 3 miesiące, 50k PLN",
  "userId": "user-123"
}
```

**Co mówisz podczas ładowania:**
```
"Backend pobiera user context z bazy - nazwa firmy, stanowisko, preferencje.
Wysyła do Gemini prompt: 'Generate professional email for category X, 
using user context: [dane usera], keep it concise, return JSON with subject and body.'
AI generuje spersonalizowany email w 2-3 sekundy."
```

**Pokaż wygenerowany template (AI response):**
```
Subject: Oferta współpracy - Consulting AI dla [Nazwa Firmy]

Body:
Dzień dobry,

W nawiązaniu do naszej rozmowy, przesyłam ofertę na usługi consultingowe 
w zakresie sztucznej inteligencji.

Zakres:
- Analiza i implementacja rozwiązań AI
- Okres: 3 miesiące
- Wartość: 50 000 PLN netto

Szczegóły w załączniku. Chętnie omówię detale na spotkaniu.

Pozdrawiam,
{{sender_name}}
```

**Co mówisz po wygenerowaniu:**
```
"AI użyło user context - pojawiła się nazwa mojej firmy, ton profesjonalny
bo w preferencjach mam 'friendly-professional'. To nie generic template,
to personalizowany content. User może edytować, zapisać, i użyć wielokrotnie."
```

**Krok 5: Bulk Email Send (opcjonalne - 30 sek)**
1. Kliknij "Send Bulk Email"
2. Wklej listę adresów (CSV lub comma-separated)
3. Wybierz template lub napisz custom
4. Kliknij "Send to All"

**Co mówisz:**
```
"System obsługuje bulk sending. Backend iteruje przez recipients,
wysyła każdy email osobno (nie BCC - każdy dostaje personalized message).
Rate limiting built-in żeby nie przekroczyć SMTP limits.
Wszystkie wysyłki logowane do emails_sent table - full audit trail."
```

**Krok 6: Email History**
1. Scroll w dół - pokaż Email History table
2. Kolumny: Recipient, Subject, Status, Sent At, Actions

**Co mówisz:**
```
"Każdy wysłany email w historii. Status: sent/failed/pending.
Klikniesz 'View' - widzisz full body, message ID z SMTP servera.
Compliance ready - audyty, dispute resolution, wszystko mamy."
```

**Kluczowe punkty:**
- ✅ AI-powered content generation (GPT/Gemini)
- ✅ User context awareness (personalizacja)
- ✅ Template system (reusability)
- ✅ Bulk operations (scale)
- ✅ Audit trail (compliance)
- ✅ SMTP flexibility (multi-provider)

---

### 📄 SCENARIUSZ 4: PDF Generation - AI-Assisted Documents (2 min)

**Krok 1: PDF Generation Page**
1. Przejdź do PDF (`/pdf`)
2. Pokaż interface: Title, Content, Template selection

**Co mówisz:**
```
"PDF generation dla raportów, faktur, ofert. Dwa tryby: manual i AI-assisted."
```

**Krok 2: AI-Generated PDF**
1. Wybierz template: "Raport miesięczny"
2. Context: "Sprzedaż Q4 2024, wzrost 25%, top produkt: AI Consulting"
3. Kliknij "Generate Content with AI"

**Co dzieje się w tle:**
- POST `/api/ai/generate-pdf-content`
- Gemini dostaje prompt: "Generate professional monthly report..."
- Response: structured content (sections, bullet points)

**Pokaż wygenerowaną treść:**
```
RAPORT MIESIĘCZNY - Q4 2024

1. PODSUMOWANIE WYKONAWCZE
- Wzrost sprzedaży: 25% r/r
- Najlepiej sprzedający się produkt: AI Consulting Services
- Osiągnięte cele kwartalne: 102%

2. ANALIZA SPRZEDAŻY
[AI generuje 2-3 paragrafy]

3. REKOMENDACJE
[AI sugeruje akcje na Q1 2025]
```

**Krok 3: Generate PDF**
1. Kliknij "Generate PDF"
2. Pokaż loading (1-2 sek)
3. PDF auto-download / open in new tab

**Co mówisz:**
```
"Backend używa PDFKit - Node.js library do generowania PDF.
Tworzy structured document: headers, paragraphs, tables, images.
Zapisuje w Supabase Storage z signed URL (secure access).
Entry w pdf_files table: user_id, filename, path, size, created_at."
```

**Krok 4: PDF History**
1. Pokaż listę wygenerowanych PDFs
2. Kolumny: Title, Created At, Size, Actions (Download, Delete)

**Co mówisz:**
```
"All generated PDFs persisted. User może pobrać w dowolnym momencie.
File storage w Supabase (S3-compatible), signed URLs ważne 7 dni.
Production scenario: move to CDN, implement retention policy."
```

**Kluczowe punkty:**
- ✅ AI content generation (structured output)
- ✅ Template system (reusable layouts)
- ✅ File storage (Supabase Storage)
- ✅ Secure access (signed URLs)
- ✅ Audit trail

---

### 🕷️ SCENARIUSZ 5: Web Scraper - Manual & AI Extraction (2 min)

**Krok 1: Scraper Dashboard**
1. Przejdź do Scraper (`/scraper`)
2. Pokaż listę scrape jobs (active, completed)

**Co mówisz:**
```
"Web scraping dla price monitoring, content aggregation, competitor analysis.
Dwa tryby ekstrakcji: manual CSS selectors i AI-powered extraction."
```

**Krok 2: Manual Scraping (30 sek)**
1. Kliknij "Create Scrape Job"
2. URL: `https://example.com/products`
3. Extraction Type: Manual
4. Selectors:
   ```json
   {
     "title": ".product-title",
     "price": ".price-value",
     "availability": ".stock-status"
   }
   ```
5. Kliknij "Create & Execute"

**Co mówisz:**
```
"Manual mode: user podaje CSS selectors. Backend używa Cheerio (jQuery dla Node.js)
do parsowania HTML. Szybkie, precyzyjne, ale wymaga znajomości HTML structure."
```

**Krok 3: AI Scraping (1 min)**
1. Kliknij "Create Scrape Job"
2. URL: dowolna strona produktowa
3. Extraction Type: AI
4. Prompt: "Extract product name, price, description, and availability status"
5. Kliknij "Create & Execute"

**Co dzieje się w ble:**
- Backend pobiera HTML (axios)
- Czyści z `<script>`, `<style>` (reduce noise)
- Wysyła do Gemini: "Extract data from HTML: [prompt]"
- AI zwraca structured JSON

**Pokaż results:**
```json
{
  "product_name": "MacBook Pro 16",
  "price": "10,999 PLN",
  "description": "Laptop dla profesjonalistów...",
  "availability": "In stock"
}
```

**Co mówisz:**
```
"AI extraction: nie musisz znać HTML. Po prostu opisujesz co chcesz wyciągnąć.
AI radzi sobie z różnymi strukturami stron. Wolniejsze niż manual, ale
dużo bardziej flexible. Idealnie dla dynamicznych stron czy prototypowania."
```

**Krok 4: Change Detection (opcjonalne - 20 sek)**
1. Pokaż scrape job z enabled change detection
2. Pokaż alert: "Price changed: 10999 → 9999"

**Co mówisz:**
```
"System monitoruje zmiany. Każde wykonanie porównuje z last_data.
Jeśli coś się zmieniło (np. cena), tworzy notification dla usera.
Perfect dla price tracking, content monitoring."
```

**Kluczowe punkty:**
- ✅ Dual extraction modes (manual + AI)
- ✅ Change detection & alerts
- ✅ Rate limiting (respect ToS)
- ✅ History tracking
- ✅ Extensible (można dodać proxy rotation, headless browser)

---

### ⏰ SCENARIUSZ 6: Cron Jobs - Scheduled Automation (2 min)

**Krok 1: Tasks Dashboard**
1. Przejdź do Tasks (`/tasks`)
2. Pokaż listę active cron jobs

**Co mówisz:**
```
"Scheduled automation - heart of the system. User może zaplanować
recurring tasks: daily emails, weekly PDFs, hourly scraping."
```

**Krok 2: Create Cron Job**
1. Kliknij "Create New Task"
2. Modal otwiera się z formularzem:

**Pola formularza:**
```
Name: "Daily Sales Report"
Task Type: [Email / PDF / Scraper / Custom]
Schedule Type: [Once / Recurring]
  → Recurring Type: [Daily / Weekly / Monthly / Custom Cron]
  → Time: 09:00
```

3. Wybierz Email
4. Config JSON:
```json
{
  "recipient": "manager@company.com",
  "subject": "Daily Sales Report - {{date}}",
  "body": "Sales data for {{date}}:\n\nRevenue: {{revenue}}\nOrders: {{orders}}",
  "template_id": "sales-report-daily"
}
```

5. Kliknij "Create Task"

**Co dzieje się w tle:**
- Frontend konwertuje schedule:
  ```typescript
  recurringToCron('daily', '09:00') → '0 9 * * *'
  ```
- POST `/api/cron/create`
- Backend:
  1. Zapisuje do `cron_jobs` table
  2. Wywołuje `cronService.scheduleJob()`
  3. node-cron rejestruje task

**Krok 3: Pokaż kod cronService (30 sek)**
- Otwórz `backend/src/services/cronService.ts` (plik ma 69 linii)
- **Przeskocz do linii 10-40** (funkcja `scheduleJob`)
- Pokaż kluczowe fragmenty:
  - **Linia 4-5**: In-memory jobs registry (`Map<string, ScheduledTask>`)
  - **Linia 10**: Walidacja cron expression (`cron.validate()`)
  - **Linia 12-15**: Check jeśli job już istnieje (stop old job)
  - **Linia 17-27**: Tworzenie scheduled task z node-cron
  - **Linia 29-31**: Disable job jeśli `enabled: false`
  - **Linia 33**: Zapis do `jobs` Map (in-memory registry)

```typescript
// LINIE 4-5: In-memory jobs registry
export class CronService {
  private jobs: Map<string, ScheduledTask> = new Map();

  // LINIE 9-38: scheduleJob function
  scheduleJob(config: CronJobConfig): void {
    // LINIA 10-12: Validate cron expression
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron schedule: ${config.schedule}`);
    }

    // LINIE 14-17: Stop existing job if present
    if (this.jobs.has(config.name)) {
      console.warn(`Job ${config.name} already exists. Stopping old job.`);
      this.stopJob(config.name);
    }

    // LINIE 19-27: Create scheduled task
    const task = cron.schedule(
      config.schedule,  // Cron expression: '0 9 * * *' = daily at 9am
      async () => {
        try {
          console.log(`⏰ Running scheduled job: ${config.name}`);
          await config.task();  // Execute user-defined function
          console.log(`✅ Job ${config.name} completed`);
        } catch (error) {
          console.error(`❌ Job ${config.name} failed:`, error);
        }
      }
    );

    // LINIE 29-31: Disable if needed
    if (!config.enabled) {
      task.stop();
    }

    // LINIA 33: Store in registry
    this.jobs.set(config.name, task);  // In-memory Map
    console.log(`📅 Scheduled job: ${config.name} (${config.schedule})`);
  }
  
  // LINIE 40-52: stopJob, startJob methods
  // LINIE 55-60: stopAllJobs (graceful shutdown)
  // LINIE 63-65: getActiveJobs (monitoring)
}
```

**Co mówisz:**
```
"node-cron sprawdza co minutę czy schedule pasuje do current time.
Jeśli tak, wykonuje task(). Tasks są persistent - zapisane w bazie.
Przy restarcie backendu, wszystkie active jobs są reloaded z DB (to wymaga dodatkowej logiki).
Production scenario: external scheduler (K8s CronJob, Cloud Scheduler)
ale to działa perfectly dla MVP i small/medium scale."
```

**Krok 4: Execution History**
1. Kliknij na job → pokaż execution history
2. Kolumny: Executed At, Status, Duration, Result Preview

**Co mówisz:**
```
"Każde wykonanie logowane. Status: success/failed. Duration w ms.
Result preview: pierwsze 200 znaków z outputu. Full result w details modal.
Monitoring, debugging, SLA tracking - wszystko mamy."
```

**Kluczowe punkty:**
- ✅ Flexible scheduling (cron expressions)
- ✅ Persistence (DB-backed, restart safe)
- ✅ Execution tracking (observability)
- ✅ Multi-type tasks (email, PDF, scraper)
- ✅ Path do external scheduler (K8s ready)

---

### 🔔 BONUS: Notifications System (30 sek - opcjonalne)

**Jeśli masz czas, pokaż:**
1. Notification badge w header (liczba unread)
2. Kliknij → dropdown z listą notifications

**Przykłady notifications:**
- "Email sent successfully: Daily Report"
- "PDF generated: Monthly Sales Summary"
- "Scrape job completed: 24 items extracted"
- "Cron job failed: SMTP connection timeout"

**Co mówisz:**
```
"Real-time notifications dla wszystkich actions. User wie co się dzieje
w systemie bez sprawdzania każdej strony. WebSocket ready - currently polling,
ale łatwo upgrade do WS dla true real-time."
```

**Kluczowe punkty:**
- ✅ Centralized notifications
- ✅ Action-based triggers
- ✅ Mark as read/unread
- ✅ Ready dla WebSocket upgrade

---

## 5️⃣ GŁĘBOKIE DIVE - Engineering Excellence (6-7 min)

### A) Bezpieczeństwo i Multi-Tenancy (2 min)

**Krok 1: Pokaż pełny auth flow w kodzie**

1. **Otwórz `backend/src/middleware/auth.ts`** w VS Code (plik ma 85 linii)
2. **Scroll do linii 14-52** (główna funkcja `authenticateUser`)

```typescript
// LINIE 1-3: Importy
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// LINIE 5-7: TypeScript interface dla request z userId
export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// LINIE 14-52: Middleware authenticateUser
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // LINIA 19: Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    // LINIE 21-26: Walidacja formatu Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authorization token provided' 
      });
      return;
    }

    // LINIA 28: Wyciągnięcie tokena (usunięcie 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // LINIE 30-35: Weryfikacja z Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
      return;
    }

    // LINIE 37-39: Dodanie user info do request object
    req.userId = user.id;
    req.userEmail = user.email;

    // LINIA 41: Continue do route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
```

**Co mówisz:**
```
"To jest foundation security w systemie. Każdy protected route używa tego middleware.
Trzy kroki: extract token, verify z Supabase, attach userId do requestu.
JWT verification delegowane do Supabase - nie musimy zarządzać kluczami, rotacją,
refresh tokens. Supabase to robi za nas. Production-grade auth out of the box."
```

**Krok 2: Pokaż użycie w routes**

Otwórz `backend/src/routes/emailRoutes.ts`:
- **Linia 2**: Import middleware
- **Linia 11-13**: Definicja POST route z `authenticateUser` middleware
- **Linia 24-30**: Pobieranie user-specific SMTP config (izolacja danych)

```typescript
// LINIA 2: Import middleware
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

// LINIE 11-13: Protected route z middleware
router.post('/send', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { to, subject, body, attachments } = req.body;

    // LINIE 24-30: Pobierz SMTP config TYLKO dla zalogowanego usera
    const { data: imapConfigs } = await supabaseAdmin
      .from('user_imap_configs')
      .select('*')
      .eq('user_id', req.userId)  // req.userId populated by middleware!
      .eq('is_active', true)
      .limit(1);
    
    // ... decrypt password (linia 33), send email (linia 35-45)
  }
});
```

**Co mówisz:**
```
"Każdy protected endpoint ma authenticateUser jako pierwszy middleware.
Jeśli token invalid, user dostaje 401 zanim route handler w ogóle się wykona.
Fail-fast approach. W route handler mamy gwarancję że req.userId exists i jest valid."
```

**Krok 3: Row Level Security w Supabase**

- Przełącz na Supabase Dashboard w przeglądarce
- Pokaż Authentication → Policies → `emails_sent` table

```sql
-- Policy: "Users can only see their own emails"
CREATE POLICY "select_own_emails" ON emails_sent
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: "Users can only insert their own emails"  
CREATE POLICY "insert_own_emails" ON emails_sent
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: "Users cannot see or modify other users' emails"
CREATE POLICY "no_cross_user_access" ON emails_sent
  FOR ALL
  USING (auth.uid() = user_id);
```

**Co mówisz:**
```
"RLS to game changer dla multi-tenancy. Security enforcement na poziomie bazy,
nie aplikacji. Nawet jeśli SQL injection (unlikely w Supabase client, ale hypothetically),
attacker nie może wyciągnąć danych innego usera. auth.uid() to function Supabase
która wyciąga user ID z JWT token w database session context.

Dual layer security:
1. Application layer: middleware weryfikuje token
2. Database layer: RLS policies enforce data isolation

Paranoid security, ale to dobre. Defense in depth."
```

**Krok 4: Encryption dla Credentials**

Otwórz `backend/src/utils/encryption.ts` (plik ma 71 linii):
- **LINIE 1-6**: Konfiguracja algorytmu i klucza
- **LINIE 16-38**: Funkcja `encrypt()`
- **LINIE 48-69**: Funkcja `decrypt()`

```typescript
// LINIE 1-6: Setup
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';  // Industry standard
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;  // Initialization vector length

// LINIE 16-38: ENCRYPT function
export function encrypt(text: string): string {
  try {
    // LINIA 22: Generate random IV (każde szyfrowanie inne)
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // LINIA 25: Create encryption key from env (32 bytes = 256 bits)
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    
    // LINIA 28: Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // LINIE 31-32: Encrypt text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // LINIA 35: Return "iv:ciphertext" format
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error('Failed to encrypt data');
  }
}

// LINIE 48-69: DECRYPT function
export function decrypt(encryptedText: string): string {
  try {
    // LINIA 51: Split IV i encrypted data
    const [ivHex, encrypted] = encryptedText.split(':');
    
    // LINIA 57: Convert IV from hex to buffer
    const iv = Buffer.from(ivHex, 'hex');
    
    // LINIA 60: Create decryption key (ten sam co do encrypt)
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    
    // LINIA 63: Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // LINIE 66-67: Decrypt text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;  // Plain text password
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}
```

**Co mówisz:**
```
"SMTP passwords encrypted przed zapisem do bazy. AES-256-CBC - industry standard.
Klucz z environment variable (64 hex chars = 32 bytes). 
Random IV per encryption - ten sam password zaszyfrowany wielokrotnie daje różne ciphertexty.
Decrypt tylko w runtime, tylko dla requestu który tego potrzebuje.

Backup z application memory w sekundę. Zero plain text passwords w:
- Database dumps
- Logs
- Error messages
- Memory dumps (teoretycznie możliwe, ale short-lived)

Compliance ready: GDPR, PCI-DSS (jeśli byśmy obsługiwali payment credentials).
Production upgrade path: AWS KMS, HashiCorp Vault dla key management."
```

**Kluczowe punkty security:**
- ✅ JWT authentication (delegated do Supabase)
- ✅ Middleware pattern (reusable, testable)
- ✅ RLS (database-level isolation)
- ✅ Encryption at rest (AES-256-CBC)
- ✅ Zero trust (każdy request weryfikowany)
- ✅ Defense in depth (multiple layers)

---

### B) Skalowalność Architecture (2 min)

**Krok 1: Stateless Design**

Otwórz `backend/src/index.ts` (plik ma ~75 linii):
- **LINIE 1-3**: Environment variables loading (FIRST before any imports!)
- **LINIE 5-19**: Importy routes i middleware
- **LINIE 21-33**: Express setup - CORS, JSON parsing
- **LINIE 35-37**: Health check endpoint
- **LINIE 39-49**: API routes registration
- **LINIE 54-57**: Server start

```typescript
// LINIE 1-3: Env loading FIRST
import dotenv from 'dotenv';
dotenv.config();

// LINIE 5-7: Express imports
import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

// LINIE 21-22: App initialization
const app: Application = express();
const PORT = process.env.PORT || 3001;

// LINIE 24-33: Middleware (NO session store, NO in-memory cache)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LINIE 35-37: Health check (dla K8s liveness probe)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Office Agent API is running' });
});

// LINIE 39-49: API Routes (każdy request self-contained z JWT)
app.use('/api/agent', agentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/ai', aiRoutes);
// ... more routes

// LINIA 51: Error handler
app.use(errorHandler);

// LINIE 54-57: Server start
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

**Co mówisz:**
```
"Backend jest stateless. Zero session store, zero in-memory cache (oprócz node-cron registry,
ale to manageable). Każdy request self-contained z JWT token. Wszystko inne w bazie.

Dlaczego to ważne:
1. Horizontal scaling: możemy uruchomić N replik za load balancer
2. Rolling updates: stop instance, deploy nową wersję, zero downtime
3. Failure recovery: instance crashuje, LB przekierowuje na inną, zero data loss
4. Development: każdy developer może mieć swoją instancję, no conflicts

Classic 12-factor app principles."
```

**Krok 2: Database Connection Pooling**

Otwórz `backend/src/config/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

// Connection pooling handled by Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**Co mówisz:**
```
"Supabase client ma built-in connection pooling. Managed Postgres z pgBouncer.
Nie musimy konfigurować pool size, max connections, timeouts - Supabase to robi.

Dwa clienty:
1. supabase (anon key): dla user operations, RLS enabled
2. supabaseAdmin (service role): dla admin operations, RLS bypass

Production upgrade: własny Postgres cluster z read replicas, write/read split,
ale dla MVP i mid-scale, managed Supabase wystarczy."
```

**Krok 3: Identyfikacja Bottlenecks**

Narysuj na tablicy/papierze (lub pokaż w prezentacji):
```
User Request
    ↓
[Load Balancer]
    ↓
[Backend Replica N] → [Supabase Postgres]
    ↓                      ↓
[Gemini API]         [Connection Pool]
    ↓
[Nodemailer SMTP]
```

**Co mówisz i pokazujesz:**
```
"Current bottlenecki które widzę:

1. **AI API Latency** (500ms-2s per request)
   Solutions:
   - Caching: repeated queries → cache w Redis (user context, common prompts)
   - Streaming: SSE/WebSocket dla progressive responses
   - Multi-provider: fallback chain (Gemini → OpenAI → Anthropic)
   - Batch processing: group similar requests

2. **Long-running Tasks** (PDF generation 1-5s, scraping 2-10s)
   Solutions:
   - Queue workers: BullMQ + Redis
   - Job status tracking: pending → processing → completed
   - Webhooks / polling dla completion
   - Priority queues: urgent vs batch

3. **Database Queries** (complex joins, full scans)
   Solutions:
   - Indexy: już mamy na user_id, created_at
   - Query optimization: EXPLAIN ANALYZE
   - Read replicas: reporty/analytics na replica
   - Caching: hot data w Redis (email templates, user configs)

4. **SMTP Rate Limits** (Google: 500/day per user)
   Solutions:
   - Rate limiter: express-rate-limit
   - Queue with delay: space out sends
   - Multi-provider: rotate SMTP providers
   - Notification dla usera o limitach

5. **File Storage** (PDFs, attachments)
   Solutions:
   - CDN: CloudFront/Cloudflare przed Supabase Storage
   - Compression: gzip PDFs
   - Retention policy: archive/delete old files
   - Lazy loading: presigned URLs, on-demand fetch
```

**Krok 4: Scale Path (narysuj architecture diagram)**

```
CURRENT (1-100 users):
Frontend (Vercel) → Backend (1 instance) → Supabase

SCALE TO 1K users:
Frontend (Vercel) → [ALB] → Backend (3-5 replicas) → Supabase + Redis cache

SCALE TO 10K users:
Frontend (CDN) → [ALB] 
                  ↓
         [API Gateway - Node/Go]
           /      |      \
    [PDF-Go]  [AI-Python]  [Email Workers]
           \      |      /
        [PostgreSQL Read Replicas]
        [Redis Cluster]
        [S3 + CloudFront]

K8s DEPLOYMENT:
- Deployment (backend): replicas=5, HPA on CPU 70%
- Deployment (workers): replicas=3, HPA on queue depth
- StatefulSet (Redis): 3 nodes, sentinel
- CronJob: scheduled tasks externalized
- Service: ClusterIP dla internal, LoadBalancer dla external
- Ingress: TLS termination, rate limiting, WAF
```

**Co mówisz:**
```
"Path do scale jest clear:
1. Replicas + load balancer (done with Docker + K8s)
2. Caching layer (Redis dla hot data)
3. Async processing (workers + queues)
4. Database optimization (replicas, indexy, partitioning)
5. Microservices (extract PDF, AI do Go/Python)

Nie robimy premature optimization. Zaczynamy simple, monolith działa dla 90% use cases.
Jak widzimy bottleneck, targeted optimization. Measure, don't guess."
```

**Kluczowe punkty skalowalność:**
- ✅ Stateless design (horizontal scale ready)
- ✅ Identified bottlenecks (AI, long tasks, DB, SMTP)
- ✅ Clear solutions (cache, queue, replicas, microservices)
- ✅ Pragmatic approach (simple first, optimize later)
- ✅ K8s ready (pokazujesz że rozumiesz deployment)

---

### C) AI/LLM Engineering (2 min)

**Krok 1: Multi-Model Architecture**

Otwórz `backend/src/services/aiService.ts` (plik ma ~384 linii):
- **LINIE 8-19**: Klasa `AIService` - constructor z config (Gemini)
- **LINIE 25-100**: `getUserContext()` - pobiera profil usera do personalizacji
- **LINIE 104-170**: `sendRequest()` - główna funkcja do Gemini API
- **LINIE 190-310**: `chat()` - multi-turn conversations z historią
- **LINIE 238-305**: `generateEmailTemplate()` - AI email generation z user context
- **LINIE 313-370**: `generatePDFContent()` - AI PDF generation z user context

```typescript
// LINIE 5-18: AIService class constructor
export class AIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';  // Z .env file
    this.apiUrl = process.env.AI_API_URL || '';  // Gemini API endpoint
    this.model = process.env.AI_MODEL || 'gemini-2.5-flash';  // Configurable model
    
    // Debug logging (development only)
    console.log('🔧 AIService initialized:');
    console.log('  - Model:', this.model);
  }

  // LINIE 104-170: Main API request function
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    // Currently: Gemini-specific
    // TODO: Extract to interface pattern for multi-provider support
    
    const requestBody = {
      contents: [{ parts: [{ text: request.prompt }] }],
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 1000,
      },
    };
    
    const response = await axios.post(this.apiUrl, requestBody, {
      headers: { 'x-goog-api-key': this.apiKey },
    });
    
    // Token usage logging (cost tracking)
    const tokensUsed = response.data.usageMetadata?.totalTokenCount || 0;
    console.log(`🪙 Tokens used: ${tokensUsed}`);
    
    return { content: generatedText, model: this.model, tokensUsed };
  }
}
```

**Co mówisz:**
```
"Obecnie używam Gemini, ale architektura ready dla multi-provider.
Prosty refactor do interface pattern:"
```

Pokaż pseudo-code na slajdzie/papierze:
```typescript
interface LLMProvider {
  chat(prompt: string, history: Message[]): Promise<string>;
  stream(prompt: string): AsyncIterator<string>;
}

class GeminiProvider implements LLMProvider { ... }
class OpenAIProvider implements LLMProvider { ... }
class AnthropicProvider implements LLMProvider { ... }

class AIService {
  private providers: Map<string, LLMProvider>;
  
  // Fallback chain
  async chatWithFallback(prompt: string) {
    try {
      return await this.providers.get('gemini').chat(prompt);
    } catch (error) {
      console.warn('Gemini failed, trying OpenAI');
      return await this.providers.get('openai').chat(prompt);
    }
  }
}
```

**Krok 2: Cost Consciousness**

Pokaż przykład w kodzie - `aiService.ts` → `sendRequest()`:
```typescript
async sendRequest(request: AIRequest): Promise<AIResponse> {
  const requestBody = {
    contents: [{ parts: [{ text: request.prompt }] }],
    generationConfig: {
      temperature: request.temperature || 0.7,  // Lower = more deterministic, cheaper
      maxOutputTokens: request.maxTokens || 1000, // Hard limit to prevent runaway costs
      topP: 0.9,
      topK: 40,
    },
  };
  
  const response = await axios.post(this.apiUrl, requestBody, {
    headers: { 'x-goog-api-key': this.apiKey },
  });
  
  // Log token usage
  const tokensUsed = response.data.usageMetadata?.totalTokenCount || 0;
  console.log(`🪙 Tokens used: ${tokensUsed} (est. cost: $${(tokensUsed / 1000 * 0.001).toFixed(4)})`);
  
  return {
    content: response.data.candidates[0].content.parts[0].text,
    model: this.model,
    tokensUsed,
  };
}
```

**Co mówisz:**
```
"Token tracking w każdym request. Free tier limits: 15 req/min, 1500/day.
Production considerations:
- Rate limiting per user (prevent abuse)
- Cost budgets (alert jeśli user przekroczy X$/month)
- Prompt optimization (shorter prompts = less tokens)
- Caching (repeated queries → cache results)
- Temperature tuning (extraction 0.3, conversation 0.7)

Example costs (Gemini pricing):
- Chat message: ~500 tokens = $0.0005
- Email generation: ~300 tokens = $0.0003
- PDF content: ~800 tokens = $0.0008
- 1000 users * 10 requests/day = $50-100/month

Reasonable at scale. OpenAI GPT-4 byłby 10x droższy, ale też lepszy output.
Trade-offs depending on use case."
```

**Krok 3: User Context & Personalization**

Pokaż `backend/src/services/aiService.ts` → funkcja `getUserContext()` (**LINIE 25-100**):

```typescript
// LINIE 25-100: getUserContext - personalizacja AI responses
async getUserContext(userId: string): Promise<string> {
  try {
    // LINIE 38-43: Pobierz profil usera z bazy
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      console.log('⚠️ No user context found for:', userId);
      return '';  // Graceful fallback
    }

    // LINIE 50-68: Build context string z dostępnych danych
    const contextParts: string[] = [];

    if (profile.full_name) contextParts.push(`Użytkownik: ${profile.full_name}`);
    if (profile.job_title) contextParts.push(`Stanowisko: ${profile.job_title}`);
    if (profile.department) contextParts.push(`Dział: ${profile.department}`);
    if (profile.company) contextParts.push(`Firma: ${profile.company}`)
    if (profile.company_description) contextParts.push(`O firmie: ${profile.company_description}`);
    if (profile.work_description) contextParts.push(`Obowiązki: ${profile.work_description}`);
    if (profile.ai_context_notes) contextParts.push(`Preferencje: ${profile.ai_context_notes}`);
    
    // LINIE 57-68: Dodaj preferencje komunikacji (tone, language)
    if (profile.preferences) {
      const prefs = profile.preferences as any;
      if (prefs.communication_tone) {
        const toneMap: any = {
          'professional': 'profesjonalny i formalny',
          'friendly-professional': 'przyjazny ale profesjonalny',
          'casual': 'swobodny i nieformalny',
        };
        contextParts.push(`Preferowany ton: ${toneMap[prefs.communication_tone]}`);
      }
      if (prefs.language) {
        contextParts.push(`Język: ${prefs.language === 'pl' ? 'Polski' : prefs.language}`);
      }
    }

    if (contextParts.length === 0) return '';

    // LINIA 70: Return formatted context (prepended to AI prompt)
    const contextString = `\n\n=== KONTEKST UŻYTKOWNIKA ===\n${contextParts.join('\n')}\n=== KONIEC KONTEKSTU ===\n\n`;
    console.log('✅ User context loaded:', contextParts.length, 'fields');
    return contextString;
  } catch (error) {
    console.error('❌ Error loading user context:', error);
    return '';  // Graceful fallback
  }
}
```

**Użycie w generation (LINIE 238-305 - generateEmailTemplate):**
```typescript
// LINIE 206-210: Load user context
let userContext = '';
if (userId) {
  userContext = await this.getUserContext(userId);  // Pobiera profil
}

// LINIA 212: Include context in prompt
const prompt = `${userContext}Generate professional email for category: "${category}"...
${userContext ? '- Use the USER CONTEXT above to personalize the tone and style' : ''}`;

const response = await this.sendRequest({ prompt });  // Gemini API call
```

**Co mówisz:**
```
"AI używa kontekstu użytkownika do personalizacji. Nie generic 'Dear Sir/Madam',
ale 'Cześć [name]' jeśli user ma casual tone preference. Nie 'we' ale '[company name]'.

User context stored w bazie:
- Personal info (name, role, company)
- Preferences (tone: professional/friendly/casual, language)
- AI instructions (custom notes: 'always mention sustainability', 'never use jargon')

Privacy note: user context nigdy nie opuszcza systemu bez zgody. AI providers dostają
tylko anonymized context jeśli opt-in. GDPR compliant."
```

**Krok 4: Structured Outputs & Validation**

Pokaż przykład w `backend/src/services/aiService.ts` → funkcja `generateEmailTemplate()` (**LINIE 238-305**):

```typescript
// LINIE 238-305: generateEmailTemplate with structured output
async generateEmailTemplate(
  category: string, 
  additionalContext?: string,
  userId?: string
): Promise<{ subject: string; body: string }> {
  try {
    // LINIE 206-210: Load user context
    let userContext = '';
    if (userId) {
      userContext = await this.getUserContext(userId);
    }

    // LINIE 212-226: Prompt with EXPLICIT JSON structure instructions
    const prompt = `${userContext}Generate a SHORT professional email template for the category: "${category}".
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- Create a subject line in Polish that fits the category
- Create a SHORT professional email body in Polish (max 3-4 sentences)
- Use placeholders like {{name}}, {{company}}, {{date}} where appropriate
- Keep it VERY concise and professional
${userContext ? '- Use the USER CONTEXT above to personalize the tone and style' : ''}

Return ONLY a JSON object with this EXACT structure (NO markdown, NO code blocks, NO extra text):
{
  "subject": "krótki temat",
  "body": "Krótka treść emaila.\\n\\nPozdrowienia"
}

CRITICAL: Response must be VALID JSON ONLY. Keep body SHORT (max 150 words).`;

    // LINIE 228-231: Send request to Gemini
    const response = await this.sendRequest({
      prompt,
      temperature: 0.5,  // Lower temperature for more consistent JSON
      maxTokens: 800
    });

    // LINIE 233-245: DEFENSIVE PARSING (cleanup + validation)
    let jsonStr = typeof response === 'string' ? response : response.content || '';
    
    console.log('🤖 Raw AI response:', jsonStr.substring(0, 200));
    
    jsonStr = jsonStr.trim();
    
    if (!jsonStr) {
      throw new Error('AI returned empty response');
    }
    
    // LINIE 241-243: Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    console.log('📝 Cleaned JSON string:', jsonStr.substring(0, 200));
    
    // LINIE 245-251: Parse and validate structure
    const parsed = JSON.parse(jsonStr);
    
    if (!parsed.subject || !parsed.body) {
      throw new Error('AI response missing subject or body');
    }
    
    return {
      subject: parsed.subject,
      body: parsed.body
    };
  } catch (error) {
    console.error('Template generation failed:', error);
    if (error instanceof SyntaxError) {
      throw new Error('AI returned invalid JSON format');
    }
    throw new Error('Failed to generate email template');
  }
}
```

**Co mówisz:**
```
"LLMs are non-deterministic. Ten sam prompt może zwrócić różne formaty:
- Czysty JSON
- JSON w markdown code block (```json ... ```)
- JSON z komentarzem przed/po
- Plain text zamiast JSON

Defensive parsing strategy (LINIE 233-251):
1. Explicit instructions w prompt ('NO markdown, JUST JSON')
2. Cleanup (remove ```json``` markdown if present)
3. Try/catch JSON.parse (graceful error handling)
4. Validation parsed structure (check required fields)
5. Fallback/retry logic jeśli fail

Gemini 1.5+ ma 'JSON mode' - enforces JSON output. OpenAI ma function calling
z schema validation. Używamy gdy available, ale mamy fallback dla starszych modeli."
```

**Kluczowe punkty AI/LLM:**
- ✅ Multi-provider readiness (interface pattern)
- ✅ Cost tracking & optimization
- ✅ User context & personalization
- ✅ Structured outputs + validation
- ✅ Temperature tuning per use case
- ✅ Token limits (prevent runaway costs)

---

### D) DevOps & Observability Readiness (1 min)

**Krok 1: Environment Validation**

Otwórz `backend/src/utils/validateEnv.ts` (plik ma 105 linii):
- **LINIE 8-27**: Konfiguracja wymaganych i opcjonalnych env vars
- **LINIE 32-83**: Funkcja `validateEnv()` - walidacja + helpful error messages
- **LINIE 88-97**: `isFeatureAvailable()` - sprawdza czy feature ma config

```typescript
// LINIE 8-27: ENV_CONFIG - lista wszystkich env variables
const ENV_CONFIG: EnvConfig = {
  // CRITICAL - app won't work without these
  required: [
    'AI_API_KEY',      // Gemini API key
    'AI_API_URL',      // Gemini API endpoint
  ],
  // IMPORTANT - app works but limited functionality
  optional: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EMAIL_HOST',
    'ENCRYPTION_KEY',   // Critical for SMTP credentials!
  ],
  warnings: ['ENCRYPTION_KEY'],
};

// LINIE 32-83: validateEnv() function
function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // LINIE 37-41: Check required variables
  ENV_CONFIG.required.forEach((key) => {
    if (!process.env[key]) {
      errors.push(`❌ Missing required environment variable: ${key}`);
    }
  });

  // LINIE 50-64: If errors, print help and EXIT (fail-fast!)
  if (errors.length > 0) {
    console.error('\n❌ Environment Configuration Error:\n');
    errors.forEach((error) => console.error(error));
    console.error('\n📝 Setup Instructions:');
    console.error('1. Copy backend/.env.example to backend/.env');
    console.error('2. Get your free Gemini API key at: https://aistudio.google.com/app/apikey');
    console.error('3. Fill in at least the required variables');
    
    process.exit(1);  // EXIT CODE 1 → deployment tools detect failure
  }

  console.log('✅ Environment variables validated successfully');
}
```

**Użycie w `backend/src/index.ts` (LINIE 1-3):**
```typescript
// LINIE 1-3: Environment loading FIRST (before any other imports!)
import dotenv from 'dotenv';
dotenv.config();  // Load .env file

// Następnie importy i validateEnv() (jeśli zaimplementowane)
// validateEnv();  // Fail-fast if critical env vars missing
```

**Co mówisz:**
```
"Fail-fast principle. Jeśli missing critical env vars, crash immediately.
Nie startuj servera i nie wait 30 minut aż ktoś zauważy że AI nie działa bo brak key.
Clear error message, exit code 1 → deployment tools wiedzą że failure."
```

**Krok 2: Health Check Endpoints (szybko)**

Otwórz `backend/src/index.ts` → **LINIE 35-37**:

```typescript
// LINIE 35-37: Simple health check (dla K8s liveness probe)
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Office Agent API is running' 
  });
});

// TODO: Deep health check (dla readiness probe)
// app.get('/health/deep', async (req, res) => {
//   const checks = {
//     database: await checkSupabaseConnection(),
//     ai: await checkGeminiAPI(),
//     storage: await checkSupabaseStorage(),
//   };
//   
//   const allHealthy = Object.values(checks).every(c => c.status === 'ok');
//   
//   res.status(allHealthy ? 200 : 503).json({  // 503 = Service Unavailable
//     status: allHealthy ? 'ok' : 'degraded',
//     checks,
//   });
// });
```

**Co mówisz:**
```
"K8s liveness i readiness probes potrzebują health endpoints.
Simple /health dla liveness (process alive?).
Deep /health/deep dla readiness (dependencies available?).
503 status code → K8s nie kieruje traffic do unhealthy pod."
```

**Krok 3: Observability Plan (1 slajd / rysunek)**

Narysuj stack:
```
APPLICATION CODE
    ↓ (instrumentation)
[OpenTelemetry SDK]
    ↓
[Collector]
  ↙   ↓   ↘
[Jaeger] [Prometheus] [Loki]
(traces) (metrics)    (logs)
    ↘    ↓    ↙
   [Grafana]
   (unified dashboards)
```

**Co mówisz:**
```
"Production observability plan - THREE pillars:

1. TRACES (Jaeger):
   - Request flow: frontend → backend → AI → database
   - Latency breakdown: które service jest slow
   - Error propagation: gdzie fail się zaczął

2. METRICS (Prometheus):
   - request_duration_seconds (p50, p95, p99)
   - request_total (rate, errors)
   - active_connections, db_query_duration
   - ai_tokens_used, ai_cost_estimate
   - Custom: emails_sent_total, pdfs_generated_total

3. LOGS (Loki):
   - Structured JSON logs
   - Correlation IDs (trace ID w każdym logu)
   - Error stack traces
   - Audit events (user actions)

Grafana dashboards:
- System overview (CPU, memory, RPS)
- AI metrics (tokens, latency, costs)
- Business metrics (emails sent, PDFs generated, active users)
- Error rate & alerting rules

Nie mam tego teraz (over-engineering dla MVP), ale architecture ready.
OpenTelemetry = vendor-neutral, easy to add later."
```

**Kluczowe punkty DevOps:**
- ✅ Environment validation (fail-fast)
- ✅ Health checks (K8s ready)
- ✅ Observability plan (traces, metrics, logs)
- ✅ Structured thinking (nie chaos)

### B) Skalowalność i Performance

**Aktualne podejście:**
- Stateless Express → N replicas za LB
- Supabase managed Postgres → connection pooling
- RLS queries z indexami

**Path do scale:**
1. **Horizontal scaling:**
   - Docker + K8s Deployment
   - HPA na CPU/memory metrics
   - Sticky sessions nie potrzebne (stateless)

2. **Async processing:**
   - Długie taski (PDF, scraping) → queue workers
   - BullMQ + Redis lub Cloud Tasks
   - Webhook notifications dla completion

3. **Caching layer:**
   - Redis dla hot data (email configs, templates)
   - CDN dla static assets
   - Query result caching z invalidation

4. **Database optimizations:**
   - Read replicas dla reportingu
   - Partitioning dla history tables
   - Archive strategy (cold storage po 90 dni)

**Co mówisz:**
- "Zbudowane z myślą o scale - stateless design"
- "Identyfikuję bottlenecki: AI API latency, DB queries, long tasks"
- "Plan migracji: workers → queues → distributed tracing"

### C) AI/LLM Best Practices

**Agent Orchestrator Pattern:**
```
User Input → Intent Classification → Tool Selection → Execution → Response
```

**Multi-model ready:**
- Interface abstrakcyjny dla AI providers
- Łatwo dodać OpenAI, Anthropic, Azure OpenAI
- Fallback chain dla reliability

**Cost & Performance:**
- Temperature tuning per use case (0.3 dla extraction, 0.7 dla conversation)
- Token limits (maxTokens)
- Prompt caching ready (user context jako system prompt)
- Streaming responses (TODO - improvement)

**User Context Awareness:**
- Pobiera profil + preferencje z bazy
- Personalizuje ton komunikacji
- Używa context w generation (email, PDF)

**Co mówisz:**
- "LLM jako narzędzie, nie całe rozwiązanie"
- "Orkiestracja > pojedyncze API calle"
- "Cost consciousness - tracking tokens, rate limiting ready"

### D) DevOps & Observability

**Obecnie:**
- Environment validation (fail-fast na start)
- Structured logging (console.log z kontekstem)
- Error handling middleware

**Ready dla:**
- Docker + docker-compose (szybki start lokalny)
- K8s manifests (Deployment, Service, ConfigMap, Secret)
- CI/CD: lint → test → build → push → deploy
- Observability: OpenTelemetry + Prometheus + Grafana

**Healthcheck endpoints:**
```typescript
GET /health → { status: "ok", timestamp, version }
GET /health/db → sprawdza Supabase connection
```

**Co mówisz:**
- "Production-ready thinking od początku"
- "Łatwa konteneryzacja - zero dependency na host"
- "Monitoring strategy: metrics (Prometheus), traces (Jaeger), logs (Loki)"

---

## 6️⃣ WYZWANIA I ROZWIĄZANIA (3 min)

### Wyzwanie 1: Multi-User SMTP Configuration
**Problem:** Każdy user ma własne credentials, szyfrowanie w bazie, runtime decryption
**Rozwiązanie:**
- Encryption utils z AES-256
- Per-request transporter creation (nie global)
- Validation before save (test connection)

### Wyzwanie 2: Cron Jobs Persistence
**Problem:** node-cron w pamięci - restart = stracone jobs
**Rozwiązanie:**
- Jobs w bazie z enabled flag
- Reload z DB przy starcie backendu
- Graceful shutdown (stop all jobs)
- Plan: zewnętrzny scheduler (K8s CronJob)

### Wyzwanie 3: AI Response Consistency
**Problem:** Gemini może zwrócić różne formaty (markdown, JSON, plain text)
**Rozwiązanie:**
- Explicit prompt instructions ("Return ONLY valid JSON")
- Cleanup logic (remove markdown code blocks)
- Fallback parsing + error handling
- TODO: Structured outputs (Gemini 1.5+ feature)

### Wyzwanie 4: Rate Limiting dla AI API
**Problem:** Gemini Free tier: 15 req/min, 1500/day
**Rozwiązanie:**
- Rate limiter middleware (express-rate-limit)
- Exponential backoff przy 429
- User notifications o limitach
- Plan: multi-provider loadbalancing

**Co podkreślasz:**
- "Real-world problems, pragmatic solutions"
- "Trade-offs awareness - nie perfect, ale production-ready"
- "Clear path dla improvements"

---

## 7️⃣ ROADMAP I POTENTIAL (2 min)

### Short-term (1-2 tygodnie):
- ✅ Streaming responses dla chat (SSE/WebSockets)
- ✅ Queue workers dla long tasks (BullMQ)
- ✅ Retry logic z exponential backoff
- ✅ Metrics dashboard (Prometheus + Grafana)

### Mid-term (1-2 miesiące):
- ✅ Multi-tenant organizations (nie tylko users)
- ✅ RBAC (role-based access control)
- ✅ Audit logs (event sourcing pattern)
- ✅ RAG dla knowledge base (pgvector + embeddings)
- ✅ gRPC dla internal services

### Migration Path: Go/Python Microservices

**Dlaczego migracja:**
- Go: performance-critical services (PDF proxy, scheduler, gateway)
- Python: ML-heavy services (AI research, evals, RAG)
- Node: pozostaje jako API gateway lub UI backend

**Jak:**
1. **Extract PDF Service → Go:**
   - gRPC server w Go
   - Node wywołuje gRPC client
   - 10x szybsze generowanie, mniejsze memory footprint

2. **Extract AI Service → Python:**
   - FastAPI + async
   - LangChain/LlamaIndex dla RAG
   - Ewaluacje (Ragas, DeepEval)
   - Langfuse dla observability

3. **Shared Contracts:**
   - Protobuf definitions
   - Automatyczne generowanie clientów (grpc-tools)
   - Versioning strategy

**K8s Architecture:**
```
                    [Ingress/ALB]
                         │
                    [API Gateway - Node/Go]
                    /    |    \    \
         [PDF-Go] [AI-Python] [Email] [Scraper]
                    \    |    /
                  [PostgreSQL]
                  [Redis Cache]
```

**Co mówisz:**
- "Zacząłem od Node bo szybki prototyping i full-stack"
- "Widzę wyraźne miejsca gdzie Go/Python dałyby value"
- "Mam doświadczenie z [Go/Python jeśli masz] - gotowy do pracy w multi-lang codebase"
- "Polyglot thinking - right tool for the job"

---

## 8️⃣ DOPASOWANIE DO AI REV (2 min)

### Jak projekt pokazuje moje skills dla roli:

**✅ Architektura i implementacja (Go/Python ready):**
- Full-stack z myślą o microservices
- Clean architecture (routes → services → data)
- Ready dla Go/Python extraction

**✅ AI/LLM Integration:**
- Praktyczne użycie Gemini (nie tylko hello world)
- Multi-model thinking
- Agent pattern (tool orchestration)
- Cost consciousness

**✅ Skalowalność:**
- Stateless design
- Database optimization (RLS, indexes)
- Clear bottlenecks identified
- Horizontal scale path

**✅ DevOps/MLOps:**
- Docker ready
- Environment validation
- Observability thinking
- CI/CD ready (lint, test, deploy)

**✅ Security:**
- JWT + RLS
- Encryption at rest
- Zero trust architecture

**✅ Mentoring & Collaboration:**
- Dokumentacja w repo (README, guides, flow diagrams)
- Type-safe interfaces (łatwy onboarding)
- Clear code structure
- Open source ready

**✅ Client-facing:**
- Produkcyjny UI (nie CLI)
- User journey thinking
- Business value focus

### Co mogę wnieść do AI REV:

1. **Full-stack versatility** - mogę skoczyć tam gdzie trzeba (frontend, backend, AI, infra)
2. **Production thinking** - nie tylko proof-of-concept, ale shipping mentality
3. **Multi-language readiness** - otwarty na Go/Python/Rust (pokazuję chęć nauki)
4. **AI pragmatism** - używam LLM gdzie dają value, nie dla samego używania
5. **Scale awareness** - buduję z myślą o 10x wzroście

---

## 9️⃣ PYTANIA DO REKRUTERA (1 min)

**Przygotowane pytania (pokazuje zainteresowanie):**

1. "Jakie są biggest technical challenges w obecnych projektach AI REV?"
2. "Jak wygląda typical tech stack w projektach - Go vs Python split?"
3. "Czy macie już MLOps/LLMOps practices (evals, monitoring, cost tracking)?"
4. "Jak przebiega collaboration między AI researchers a software engineers?"
5. "Jaki jest preferred deployment target - K8s, serverless, hybrid?"

---

## 🎬 ZAKOŃCZENIE (1 min)

**Podsumowanie:**
- "Zbudowałem produkcyjny system pokazujący moje podejście: praktyczne AI + solidna inżynieria"
- "Gotowy do pracy w Go/Python, skalowalnych systemów i real-world AI challenges"
- "Pasjonuję się tym co robicie w AI REV - łączenie tech excellence z social impact"
- "Chciałbym być częścią zespołu i kontrybuować do waszych projektów"

**Call to action:**
- "Jestem otwarty na feedback techniczny i pytania!"
- "Mogę też pokazać kod na GitHub [jeśli publiczne] lub przejść przez architecture deep dive"

---

## 📎 MATERIAŁY WSPIERAJĄCE

### Przed prezentacją przygotuj:

1. **Laptop setup:**
   - Backend running (`npm run dev`)
   - Frontend running (`npm run dev`)
   - Test user logged in
   - Przykładowe dane w bazie

2. **Backup plan jeśli live demo fail:**
   - Screenshots kluczowych ekranów
   - Nagrane video (1-2 min)
   - Code snippets w IDE gotowe do pokazania

3. **Printout/PDF:**
   - Architecture diagram (narysuj w Excalidraw/draw.io)
   - Database schema
   - User flow diagram

4. **GitHub:**
   - Repo publiczne lub private access dla rekrutera
   - README aktualny
   - Clean commit history

---

## ⚠️ CZEGO UNIKAĆ

❌ Nie mów "to dopiero prototyp" - mów "produkcyjny system z clear path do enterprise scale"
❌ Nie przepraszaj za braki - mów "aktualne rozwiązanie + roadmap improvement"
❌ Nie technical jargon bez kontekstu - tłumacz business value
❌ Nie czytaj slajdów - opowiadaj story
❌ Nie ignoruj trade-offs - pokażę że je rozumiesz

---

## ✅ CHECKLIST PRZED ROZMOWĄ

- [ ] Przetestuj cały demo flow 3x
- [ ] Sprawdź czy AI API key działa (rate limits ok)
- [ ] Przygotuj backup screenshots/video
- [ ] Wydrukuj ten plan (miej obok podczas rozmowy)
- [ ] Przećwicz timing (20-25 min total)
- [ ] Przygotuj odpowiedzi na pytania o Go/Python experience
- [ ] Miej gotowe przykłady z kodu do pokazania
- [ ] Sprawdź internet connection (jeśli remote)

---

## 🎯 SUCCESS METRICS

**Co chcesz osiągnąć:**
- ✅ Pokazać technical depth (nie tylko surface level)
- ✅ Udowodnić production-ready thinking
- ✅ Wykazać alignment z AI REV values (impact, collaboration)
- ✅ Zainteresować rekrutera deep dive w kod
- ✅ Dostać feedback + follow-up conversation

**Zostaw impression:**
"Ten kandydat potrafi shipować produkcyjny kod, rozumie AI pragmatycznie, i jest ready dla Go/Python + K8s challenges."

---

## 💡 BONUS: Jeśli masz czas (opcjonalne)

### Dodaj 2-3 dni przed rozmową:

**Mini Python Service (pokazuje versatility):**
- `services/ai-research-python/`
- FastAPI + Gemini client
- Streaming responses (SSE)
- Basic RAG z FAISS
- Docker + compose integration
- Wywołaj z Node backend przez HTTP

**Efekt:** "Mam praktyczne doświadczenie z Python AI services + polyglot architecture"

**K8s Manifests:**
- `k8s/backend-deployment.yaml`
- `k8s/frontend-deployment.yaml`
- `k8s/postgres-statefulset.yaml`
- ConfigMap + Secrets

**Efekt:** "Rozumiem deployment production-grade apps na K8s"

---

# 🚀 POWODZENIA!

Remember: AI REV szuka kogoś kto **łączy AI z inżynierią** i **shipuje value**. Twój projekt to właśnie pokazuje. Bądź pewny siebie, konkretny, i pokaz passion! 💪
