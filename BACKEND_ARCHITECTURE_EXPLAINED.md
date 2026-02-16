# 🏗️ Backend Architecture - Kompletne Wyjaśnienie

## 📋 Spis Treści
1. [Wzorce Architektoniczne](#wzorce-architektoniczne)
2. [Przepływ Żądania (Request Flow)](#przepływ-żądania)
3. [Role Komponentów](#role-komponentów)
4. [Dlaczego Taka Architektura?](#dlaczego-taka-architektura)

---

## 🎯 Wzorce Architektoniczne

Twoja aplikacja wykorzystuje **kombinację kilku wzorców tzw. senior level**:

### 1. **Layered Architecture (Architektura Warstwowa)**
```
┌─────────────────────────────────────┐
│  PRESENTATION LAYER                 │  ← Routes + Controllers
│  (Warstwa prezentacji)              │     (HTTP handling)
├─────────────────────────────────────┤
│  MIDDLEWARE PIPELINE                │  ← Middleware
│  (Interceptory, Auth, Logging)      │     (Cross-cutting concerns)
├─────────────────────────────────────┤
│  BUSINESS LOGIC LAYER               │  ← Services + Orchestrators
│  (Warstwa logiki biznesowej)        │     (Domain logic)
├─────────────────────────────────────┤
│  DATA ACCESS LAYER                  │  ← Supabase Client
│  (Warstwa dostępu do danych)        │     (Database operations)
└─────────────────────────────────────┘
```

### 2. **MVC Pattern (Model-View-Controller)** - ale w wersji API
- **Model** = Services + Database (logika biznesowa + dane)
- **View** = JSON responses (dane dla frontendu)
- **Controller** = Controllers (obsługa HTTP, delegacja do Services)

### 3. **Chain of Responsibility** - Middleware Pipeline
Każdy middleware może:
- Przetworzyć request i przekazać dalej
- Zatrzymać request (np. brak autoryzacji)
- Zmodyfikować request/response

### 4. **Mediator Pattern** - AgentOrchestrator
Koordynuje wiele serwisów bez ich bezpośredniej komunikacji.

---

## 🔄 Przepływ Żądania (Request Flow)

### **Przykład: POST /api/agent/chat**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                                     │
│    POST /api/agent/chat                                               │
│    Headers: { Authorization: "Bearer <token>" }                       │
│    Body: { message: "Send email to john@example.com" }               │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE PIPELINE (w kolejności z index.ts)                     │
├──────────────────────────────────────────────────────────────────────┤
│  ✅ helmet()           → Dodaje security headers (XSS, CSP)          │
│  ✅ compression()      → Kompresuje response (gzip)                  │
│  ✅ cors()             → Waliduje origin, dodaje CORS headers        │
│  ✅ express.json()     → Parsuje JSON body → req.body                │
│  ✅ responseTime       → Dodaje X-Response-Time header               │
│  ✅ requestLogger      → Loguje request (method, url, ip, userId)    │
│  ✅ rateLimit()        → Sprawdza limity requestów (100/15min)       │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. ROUTING (Express Router)                                          │
├──────────────────────────────────────────────────────────────────────┤
│  app.use('/api/agent', agentRoutes)                                  │
│      ↓                                                                │
│  agentRoutes: router.post('/chat', optionalAuth, agentController.chat)│
│                                    ▲            ▲                     │
│                          middleware            handler                │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. ROUTE-SPECIFIC MIDDLEWARE                                         │
├──────────────────────────────────────────────────────────────────────┤
│  ✅ optionalAuth       → Waliduje JWT token (jeśli istnieje)         │
│                        → req.userId = "123e4567..."                  │
│                        → req.userEmail = "user@example.com"          │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER (AgentController.chat)                                 │
├──────────────────────────────────────────────────────────────────────┤
│  Rola: Walidacja + Delegacja                                         │
│                                                                       │
│  chat = asyncHandler(async (req, res) => {                           │
│    const { message } = req.body;                                     │
│    if (!message) throw new ValidationError('Message required');      │
│                                                                       │
│    // Deleguj do Orchestratora                                       │
│    const response = await agentOrchestrator.processMessage(          │
│      message, req.userId                                             │
│    );                                                                 │
│                                                                       │
│    // Zapisz do bazy                                                 │
│    await supabase.from('chat_messages').insert([...]);               │
│                                                                       │
│    // Zwróć response (BaseController.success)                        │
│    this.success(res, { content: response });                         │
│  });                                                                  │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 6. SERVICE LAYER (AgentOrchestrator)                                 │
├──────────────────────────────────────────────────────────────────────┤
│  Rola: Logika biznesowa + Koordynacja                                │
│                                                                       │
│  processMessage():                                                    │
│    1. Wykryj język (Polish/English)                                  │
│    2. Zbuduj prompt dla AI z dostępnymi narzędziami                  │
│    3. Wywołaj AIService → Gemini API                                 │
│    4. Sparsuj odpowiedź AI (tool: send_email)                        │
│    5. Wykonaj akcję:                                                 │
│       executeTool('send_email'):                                     │
│         → Pobierz config z DB (supabase)                             │
│         → Wyślij email (nodemailer)                                  │
│         → Zapisz w emails_sent                                       │
│    6. Zwróć natural language response dla usera                      │
└──────────────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE                                                           │
├──────────────────────────────────────────────────────────────────────┤
│  {                                                                    │
│    "success": true,                                                   │
│    "data": {                                                          │
│      "content": "✅ Email sent successfully to john@example.com!"    │
│    },                                                                 │
│    "timestamp": "2026-02-16T10:30:45.123Z"                           │
│  }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Role Komponentów

### **1. 📍 ROUTES (Routing Layer)**

**Lokalizacja:** `backend/src/routes/*.ts`

**Cel:** Mapowanie URL → Handler

```typescript
// agentRoutes.ts
router.post('/chat', optionalAuth, agentController.chat);
//           ▲       ▲              ▲
//         endpoint  middleware     handler
```

**Odpowiedzialność:**
- ✅ Definiowanie endpointów (URL + HTTP method)
- ✅ Łączenie middleware z handlerami
- ✅ Grupowanie powiązanych endpointów
- ❌ NIE zawiera logiki biznesowej
- ❌ NIE waliduje ciała requestu (to robi Controller/Middleware)

**Przykład z życia:**
> Routes to jak **recepcja w hotelu** - kieruje gości (requesty) do odpowiednich pokoi (handlerów), ale nie obsługuje ich potrzeb.

---

### **2. 🛡️ MIDDLEWARE (Interceptors Pipeline)**

**Lokalizacja:** `backend/src/middleware/*.ts`

**Cel:** Cross-cutting concerns (przecięcia poprzeczne)

**Typy middleware w projekcie:**

#### A. **Global Middleware** (wszystkie requesty)
```typescript
// index.ts
app.use(helmet());           // Security headers
app.use(compression());      // Kompresja odpowiedzi
app.use(cors());             // CORS policy
app.use(express.json());     // Body parsing
app.use(requestLogger);      // Logging
app.use(rateLimit());        // Rate limiting
```

#### B. **Route-specific Middleware** (konkretne endpointy)
```typescript
router.post('/chat', optionalAuth, handler);  // optionalAuth tylko dla /chat
router.get('/stats', authenticateUser, handler);  // authenticateUser tylko dla /stats
```

**Odpowiedzialność:**
- ✅ **Autentykacja/Autoryzacja** (auth.ts)
  - Walidacja JWT token
  - `req.userId = "123"` (wzbogacenie requesta)
  
- ✅ **Logowanie** (requestLogger.ts)
  - Request ID, IP, method, URL, response time
  
- ✅ **Rate Limiting** (rateLimit.ts)
  - 100 req/15min (global), 20 req/15min (AI)
  
- ✅ **Error Handling** (errorHandler.ts)
  - Centralizacja obsługi błędów
  - Try-catch dla async handlerów
  
- ✅ **Walidacja** (validation.ts)
  - Joi schemas dla body/params

**Analogia:**
> Middleware to jak **kontrola bezpieczeństwa na lotnisku**:
> - Sprawdzają paszport (auth)
> - Prześwietlają bagaż (validation)
> - Zapisują kogo wpuścili (logging)
> - Limitują ruch (rate limiting)

---

### **3. 🎯 CONTROLLERS (Presentation Layer)**

**Lokalizacja:** `backend/src/controllers/*.ts`

**Cel:** Obsługa HTTP + Delegacja

**Struktura:**
```typescript
class AgentController extends BaseController {
  chat = asyncHandler(async (req, res) => {
    // 1. WALIDACJA
    if (!req.body.message) throw new ValidationError('...');
    
    // 2. DELEGACJA (WAŻNE: NIE pisz całej logiki tutaj!)
    const result = await agentOrchestrator.processMessage(...);
    
    // 3. RESPONSE (dziedziczone z BaseController)
    this.success(res, result);  // 200 OK
    //   ^--- Template Method Pattern
  });
}
```

**Odpowiedzialność:**
- ✅ **HTTP-specific logic**
  - Status codes (200, 201, 400, 500)
  - Response formatting (JSON)
  - Header manipulation
  
- ✅ **Request parsing**
  - `req.body`, `req.params`, `req.query`
  - Type validation (prostą, złożoną → middleware)
  
- ✅ **Delegacja** do Services
  - `await service.doSomething()`
  
- ❌ **NIE zawiera logiki biznesowej!**
  - Złe: `if (email.includes('@')) sendEmail()`
  - Dobre: `await emailService.send(email)`

**Dlaczego tylko 3 kontrolery w projekcie?**

| Controller | Status | Powód |
|------------|--------|-------|
| **BaseController** | ✅ Używany | Abstrakcyjna klasa bazowa (Template Method Pattern) |
| **AgentController** | ✅ Używany | Wykorzystany w `/api/agent/*` |
| **DashboardController** | ❌ Nieużywany | `/api/dashboard` używa inline functions (pragmatyzm > abstrakcja) |

**Dlaczego niektóre routes nie mają kontrolerów?**

```typescript
// emailRoutes.ts - INLINE (bez kontrolera)
router.post('/send', authenticateUser, async (req, res) => {
  const { data, error } = await supabase.from('emails_sent').insert(...);
  res.json({ success: true, data });
});

// ✅ OK dla prostych operacji CRUD
// ✅ Mniej plików = szybszy development
// ⚠️ Trade-off: Mniej abstrakcji vs więcej boilerplate
```

**Analogia:**
> Controller to jak **kelner w restauracji**:
> - Przyjmuje zamówienie (request)
> - Przekazuje do kuchni (service)
> - Przynosi potrawę (response)
> - NIE gotuje sam! (to robi kucharz/service)

---

### **4. 💼 SERVICES (Business Logic Layer)**

**Lokalizacja:** `backend/src/services/*.ts`

**Cel:** Logika biznesowa + Domain logic

**Typy serwisów:**

#### A. **Domain Services** (konkretna domena)
```typescript
class EmailInboxService {
  async scanInbox(userId: string) {
    // 1. Pobierz konfigurację IMAP
    const config = await this.getImapConfig(userId);
    
    // 2. Połącz z serwerem email (IMAP protocol)
    const connection = await imaps.connect({...});
    
    // 3. Pobierz wiadomości
    const messages = await connection.search(['UNSEEN']);
    
    // 4. Parsuj każdą wiadomość
    const parsed = messages.map(msg => this.parseEmail(msg));
    
    // 5. AI: Kategoryzuj + Generuj draft odpowiedzi
    const analyzed = await aiService.analyzeEmail(parsed);
    
    // 6. Zapisz w bazie
    await supabaseAdmin.from('emails_inbox').insert(analyzed);
    
    return analyzed;
  }
}
```

#### B. **Orchestrators** (koordynacja wielu serwisów)
```typescript
class AgentOrchestrator {
  async processMessage(message: string, userId: string) {
    // 1. Wykryj intencję przez AI
    const action = await aiService.detectIntent(message, this.tools);
    
    // 2. Wykonaj narzędzie
    switch (action.tool) {
      case 'send_email':
        return await this.executeSendEmail(action.parameters, userId);
      case 'generate_pdf':
        return await pdfService.generate(...);
      case 'scrape_website':
        return await scraperService.scrape(...);
    }
  }
}
```

#### C. **Generic Services** (wzorce reużywalne)
```typescript
abstract class BaseService<T> {
  async findById(id: string): Promise<T> {
    const { data } = await supabase.from(this.tableName).select('*').eq('id', id);
    return data;
  }
  // ... CRUD operations
}

class UserContextService extends BaseService<UserContext> {
  tableName = 'user_profiles';
  // Dziedziczy: findById, create, update, delete
}
```

**Odpowiedzialność:**
- ✅ **Logika biznesowa** (działanie aplikacji)
- ✅ **Walidacja domenowa** (reguły biznesowe)
- ✅ **Komunikacja z zewnętrznymi API** (Gemini, Gmail)
- ✅ **Transformacje danych**
- ✅ **Transakcje** (multi-step operations)

**Analogia:**
> Service to jak **mechanik w warsztacie**:
> - Ma głęboką wiedzę techniczną
> - Wie JAK naprawić samochód
> - Wykorzystuje narzędzia (database, APIs)
> - Nie komunikuje się bezpośrednio z klientem (to robi recepcja/controller)

---

## 🤔 Dlaczego Taka Architektura?

### **1. Separation of Concerns (Rozdzielenie odpowiedzialności)**

```
❌ ZŁY PRZYKŁAD (wszystko w 1 pliku):
router.post('/chat', async (req, res) => {
  // 500 linii kodu:
  // - walidacja
  // - auth
  // - logika AI
  // - email sending
  // - database operations
  // - error handling
  // 🤯 NIEMOŻLIWE DO UTRZYMANIA!
});

✅ DOBRY PRZYKŁAD (warstwowo):
router.post('/chat', optionalAuth, agentController.chat);
                     ▲              ▲
                   middleware      controller → orchestrator → services
```

### **2. Reużywalność (DRY - Don't Repeat Yourself)**

```typescript
// BaseController: 1x napisane, 2x użyte
this.success(res, data);  // AgentController
this.success(res, data);  // DashboardController

// Auth middleware: 1x napisane, 13x użyte (na różnych endpointach)
```

### **3. Testowalność**

```typescript
// Unit test dla Service (bez HTTP)
describe('AIService', () => {
  it('should analyze email', async () => {
    const result = await aiService.analyzeEmail(mockEmail);
    expect(result.category).toBe('urgent');
  });
});

// Mock middleware w testach controllerów
describe('AgentController', () => {
  it('should require authentication', async () => {
    req.userId = undefined; // symulacja braku auth
    await agentController.chat(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

### **4. Skalowalność**

**Łatwe dodawanie nowych endpointów:**
```typescript
// 1. Stwórz route
router.post('/new-endpoint', authenticateUser, newController.handle);

// 2. Stwórz controller (reużyj BaseController)
class NewController extends BaseController {
  handle = asyncHandler(async (req, res) => {
    const result = await newService.doWork();
    this.success(res, result);  // ← reużywamy
  });
}

// 3. Stwórz service
class NewService { ... }
```

### **5. Bezpieczeństwo**

**Middleware centralnie zarządza security:**
```typescript
// Cała aplikacja chroniona:
app.use(helmet());        // XSS, CSP, HSTS
app.use(rateLimit());     // DDoS protection
app.use(authenticateUser); // JWT validation
```

### **6. Monitoring i Debugowanie**

**Scentralizowany logging:**
```typescript
// requestLogger middleware automatycznie loguje:
// ✓ Correlation ID (śledzenie requestów)
// ✓ Response time
// ✓ User ID
// ✓ IP address
// ✓ Errors

logger.info('Request processed', {
  correlationId: 'abc-123',
  userId: '456',
  duration: '250ms'
});
```

---

## 📊 Podsumowanie - Kto Co Robi?

| Komponent | Odpowiedzialność | Przykład | Analogia |
|-----------|------------------|----------|----------|
| **Routes** | Routing (URL → Handler) | `POST /api/agent/chat → agentController.chat` | Recepcja w hotelu |
| **Middleware** | Cross-cutting concerns | Auth, Logging, Rate Limiting, Error Handling | Kontrola bezpieczeństwa na lotnisku |
| **Controllers** | HTTP handling + Delegacja | Walidacja requestu, wywołanie service, formatowanie response | Kelner w restauracji |
| **Services** | Logika biznesowa | AI processing, Email sending, PDF generation | Kucharz/Mechanik (ekspert) |
| **Orchestrators** | Koordynacja serwisów | AgentOrchestrator łączy AI + Email + PDF + Scraper | Dyrektor orkiestry |
| **Database** | Persistence | Supabase (PostgreSQL + RLS) | Magazyn danych |

---

## 🎓 Pattern Names (Nazwy Wzorców)

Ta architektura to kombinacja:

1. **Layered Architecture** (N-Tier Architecture)
   - Separation of concerns przez warstwy

2. **MVC Pattern** (w wersji API)
   - Model = Services + Database
   - View = JSON responses
   - Controller = Controllers

3. **Chain of Responsibility** - Middleware Pipeline
   - Request przechodzi przez łańcuch handlerów

4. **Template Method Pattern** - BaseController
   - `success()`, `created()`, `noContent()` - reużywalne

5. **Service Layer Pattern**
   - Abstrakcja logiki biznesowej

6. **Dependency Injection**
   - Services wstrzykiwane do Controllerów/Orchestratorów

7. **Mediator Pattern** - AgentOrchestrator
   - Koordynuje AIService, PDFService, EmailService, ScraperService

8. **Repository Pattern** - BaseService<T>
   - Abstrakcja dostępu do danych

---

## 🚀 Przykład: Dodanie Nowego Feature

**Zadanie: Dodaj endpoint do wysyłania SMS**

```typescript
// 1. ROUTE (routing)
// backend/src/routes/smsRoutes.ts
router.post('/send', authenticateUser, smsController.send);

// 2. CONTROLLER (HTTP handling)
// backend/src/controllers/SmsController.ts
class SmsController extends BaseController {
  send = asyncHandler(async (req, res) => {
    const { to, message } = req.body;
    const result = await smsService.sendSms(to, message, req.userId);
    this.success(res, result);
  });
}

// 3. SERVICE (business logic)
// backend/src/services/smsService.ts
class SmsService {
  async sendSms(to: string, message: string, userId: string) {
    // Walidacja numeru
    if (!this.isValidPhone(to)) throw new ValidationError('Invalid phone');
    
    // Wysłanie przez API (Twilio/etc)
    const response = await axios.post('https://api.twilio.com/...', {...});
    
    // Zapisz w bazie
    await supabase.from('sms_sent').insert({
      user_id: userId,
      to,
      message,
      status: 'sent'
    });
    
    return { success: true, messageId: response.data.id };
  }
}

// 4. MIDDLEWARE (reużywamy istniejący!)
// authenticateUser - już gotowy ✅
// errorHandler - już gotowy ✅
// requestLogger - już gotowy ✅
```

**Zalety takiego podejścia:**
- ✅ Kod podzielony na małe, zrozumiałe kawałki
- ✅ Każdy plik ma 1 odpowiedzialność (Single Responsibility Principle)
- ✅ Łatwe testowanie (każda warstwa osobno)
- ✅ Reużywalne middleware (auth, logging, error handling)
- ✅ Łatwe dodawanie nowych feature bez dotykania istniejącego kodu

---

## 💡 Wnioski dla Developera

### **Kiedy używać Kontrolerów?**
✅ Endpoint ma złożoną logikę biznesową  
✅ Chcesz reużywać BaseController helpers  
✅ Planujesz wiele operacji na tym samym resource  
❌ Prosty CRUD (inline w route wystarczy)

### **Kiedy używać Middleware?**
✅ Funkcjonalność dotyczy wielu endpointów (auth, logging)  
✅ Cross-cutting concern (rate limiting, CORS)  
✅ Walidacja przed wywołaniem handlera  
❌ Logika specyficzna dla 1 endpointu (to do kontrolera)

### **Kiedy używać Serwisów?**
✅ ZAWSZE dla logiki biznesowej!  
✅ Komunikacja z zewnętrznymi API  
✅ Złożone transformacje danych  
✅ Wielokrokowe operacje (transakcje)

---

**To jest senior-level production architecture. Nie idealny podręcznikowy kod, ale pragmatyczny, skalowalny i maintainable system. 🚀**
