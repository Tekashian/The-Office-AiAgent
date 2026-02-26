# 🎯 Backend Architecture - Quick Reference

## 📚 Dostępna Dokumentacja

### 1. **BACKEND_ARCHITECTURE_EXPLAINED.md**
Szczegółowe wyjaśnienie (PL):
- Role komponentów (Routes, Middleware, Controllers, Services)
- Wzorce architektoniczne (Layered, MVC, Chain of Responsibility, Mediator)
- Przepływ requesta krok po kroku
- Analogie i przykłady
- **~300 linii** kompleksowej dokumentacji

### 2. **02-request-flow-detailed.puml**
Diagram sekwencyjny PlantUML:
- Szczegółowy przepływ requesta `POST /api/agent/chat`
- Od klienta przez middleware → controller → orchestrator → services → database → external APIs
- Wszystkie kroki z rzeczywistymi parametrami

### 3. **03-patterns-architecture.puml**
Diagram komponentowy PlantUML:
- Wszystkie warstwy architektury
- 10 używanych design patterns
- Statystyki i metryki
- Legenda z wyjaśnieniami

---

## ⚡ TL;DR - Szybki Przegląd

### **Czym są te komponenty?**

| Komponent | Rola | Analogia |
|-----------|------|----------|
| **Routes** | Mapowanie URL → Handler | Recepcja w hotelu (kieruje gości) |
| **Middleware** | Auth, Logging, Validation, Error Handling | Kontrola bezpieczeństwa na lotnisku |
| **Controllers** | HTTP handling + Delegacja do Services | Kelner (przyjmuje zamówienie, przekazuje do kuchni) |
| **Services** | Logika biznesowa + Domain logic | Kucharz (wie JAK coś zrobić) |
| **Orchestrators** | Koordynacja wielu Services | Dyrektor orkiestry |

---

## 🔄 Przepływ Requesta (Uproszczony)

```
Frontend
   ↓
   POST /api/agent/chat
   ↓
┌─────────────────────────────┐
│ 1. MIDDLEWARE PIPELINE      │
│    • helmet (security)      │
│    • cors (cross-origin)    │
│    • json parser            │
│    • logger                 │
│    • rate limiter           │
│    • auth (JWT)             │
└─────────────────────────────┘
   ↓
┌─────────────────────────────┐
│ 2. ROUTER                   │
│    Match: /api/agent/chat   │
└─────────────────────────────┘
   ↓
┌─────────────────────────────┐
│ 3. CONTROLLER               │
│    agentController.chat()   │
│    • Validate request       │
│    • Call orchestrator      │
│    • Format response        │
└─────────────────────────────┘
   ↓
┌─────────────────────────────┐
│ 4. ORCHESTRATOR             │
│    agentOrchestrator        │
│    • Detect intent (AI)     │
│    • Execute tool           │
│    • Coordinate services    │
└─────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ 5. SERVICES                         │
│    • AIService (Gemini API)         │
│    • EmailService (nodemailer)      │
│    • PDFService (Puppeteer)         │
│    • ScraperService (Cheerio)       │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────┐
│ 6. DATABASE                 │
│    Supabase (PostgreSQL)    │
└─────────────────────────────┘
   ↓
   Response JSON
   ↓
Frontend
```

---

## 🎨 Wzorce Architektoniczne

### **Nazwa architektury:**
**Layered Architecture** (Architektura Warstwowa) + **MVC Pattern** (w wersji API)

### **10 używanych Design Patterns:**

1. **Layered Architecture** - Separation of concerns przez warstwy
2. **MVC Pattern** - Model (Services + DB), View (JSON), Controller
3. **Chain of Responsibility** - Middleware pipeline
4. **Template Method** - BaseController (reużywalne metody)
5. **Mediator** - AgentOrchestrator koordynuje serwisy
6. **Repository** - BaseService<T> abstrakcja CRUD
7. **Dependency Injection** - Services wstrzykiwane przez imports
8. **Singleton** - export default new Service()
9. **Error Handling** - Centralized errorHandler
10. **Async Handler** - asyncHandler() wrapper

---

## 📂 Struktura Plików

```
backend/src/
├── index.ts                    ← Entry point (app setup)
├── middleware/                 ← 🛡️ Cross-cutting concerns
│   ├── auth.ts                 ← JWT validation
│   ├── errorHandler.ts         ← Centralized error handling
│   ├── requestLogger.ts        ← Logging
│   ├── rateLimit.ts            ← DDoS protection
│   └── validation.ts           ← Joi schemas
├── routes/                     ← 📍 URL mapping (13 endpointów)
│   ├── agentRoutes.ts          ← /api/agent/*
│   ├── emailRoutes.ts          ← /api/email/*
│   ├── pdfRoutes.ts            ← /api/pdf/*
│   └── ...
├── controllers/                ← 🎯 HTTP handling (3 total)
│   ├── BaseController.ts       ← Abstract (Template Method)
│   ├── AgentController.ts      ← ✅ Used
│   └── DashboardController.ts  ← ❌ Exists but unused
├── services/                   ← 💼 Business logic (9 total)
│   ├── BaseService.ts          ← Generic Repository
│   ├── agentOrchestrator.ts    ← Mediator
│   ├── aiService.ts            ← Gemini AI
│   ├── emailInboxService.ts    ← IMAP + AI
│   ├── emailService.ts         ← ❌ Exists but unused
│   ├── pdfService.ts           ← Puppeteer
│   ├── scraperService.ts       ← Cheerio
│   ├── cronService.ts          ← node-cron
│   └── userContextService.ts   ← extends BaseService
├── config/                     ← ⚙️ Configuration
│   ├── config.ts               ← Env variables
│   └── supabase.ts             ← Database client
└── utils/                      ← 🔧 Helpers
    ├── cache.ts                ← LRU cache
    ├── encryption.ts           ← AES-256-CBC
    ├── errors.ts               ← Custom Error classes
    ├── logger.ts               ← Winston logger
    └── performance.ts          ← Memory monitoring
```

---

## 🤔 Najczęstsze Pytania

### **1. Po co są kontrolery?**
- ✅ Obsługa HTTP (status codes, headers, response formatting)
- ✅ Walidacja requestów
- ✅ Delegacja do Services (NIE piszemy logiki biznesowej!)
- ✅ Reużywalne metody (BaseController)

### **2. Po co jest middleware?**
- ✅ **Cross-cutting concerns** (funkcjonalność przechodząca przez wiele endpointów)
- ✅ Auth, Logging, Rate Limiting, Error Handling
- ✅ **Chain of Responsibility** - request przechodzi przez pipeline
- ✅ Modyfikacja `req`/`res` przed dotarciem do handlera

### **3. Po co są routes?**
- ✅ **Routing** - mapowanie URL → Handler
- ✅ Grupowanie powiązanych endpointów
- ✅ Łączenie middleware z handlerami
- ❌ NIE zawierają logiki biznesowej

### **4. Dlaczego niektóre routes nie mają kontrolerów?**
```typescript
✅ Z kontrolerem (złożona logika):
router.post('/chat', auth, agentController.chat);
                           ↑ deleguje do orchestratora

✅ Bez kontrolera (prosty CRUD):
router.post('/send', auth, async (req, res) => {
  const { data } = await supabase.from('emails').insert(...);
  res.json({ success: true, data });
});

💡 Trade-off: Pragmatyzm > Dogma
```

### **5. Dlaczego DashboardController istnieje ale nie jest używany?**
- Dashboard routes używają inline functions (prostszy CRUD)
- **Decyzja architektury:** Speed > Abstraction
- Kontroler był eksperymentem, routes okazały się wystarczające
- **Dokumentowane w diagramie jako trade-off**

### **6. Jaka jest różnica między Service a Controller?**

| Controller | Service |
|------------|---------|
| HTTP-specific (req, res) | Business logic |
| Status codes, headers | Domain rules |
| Deleguje do Services | Komunikacja z DB/API |
| Thin (mało kodu) | Fat (dużo logiki) |
| Przykład: `res.json({...})` | Przykład: `sendEmail(to, subject)` |

---

## 💡 Kiedy Używać Czego?

### **✅ Użyj CONTROLLER gdy:**
- Endpoint ma złożoną logikę biznesową
- Chcesz reużywać BaseController helpers
- Planujesz wiele operacji na tym samym resource

### **✅ Użyj MIDDLEWARE gdy:**
- Funkcjonalność dotyczy wielu endpointów (auth, logging)
- Cross-cutting concern (rate limiting, CORS)
- Walidacja przed wywołaniem handlera

### **✅ Użyj SERVICE gdy:**
- ZAWSZE dla logiki biznesowej!
- Komunikacja z zewnętrznymi API
- Złożone transformacje danych
- Wielokrokowe operacje (transakcje)

### **✅ Użyj ORCHESTRATOR gdy:**
- Koordynujesz wiele serwisów
- Potrzebujesz mediatora między komponentami
- Złożone workflow z wieloma krokami

---

## 📊 Statystyki Backend

```
Routes:              13 endpointów
Controllers:         3 (1 abstract, 1 used, 1 unused)
Middleware:          5 plików (12 funkcji)
Services:            9 (7 active, 2 unused)
Database Tables:     17 (PostgreSQL + RLS)
Design Patterns:     10 używanych
Lines of Code:       ~5000+ LOC (backend)
```

---

## 🚀 Przykład: Dodanie Nowego Endpointu

```typescript
// 1. ROUTE (backend/src/routes/smsRoutes.ts)
router.post('/send', authenticateUser, smsController.send);

// 2. CONTROLLER (backend/src/controllers/SmsController.ts)
class SmsController extends BaseController {
  send = asyncHandler(async (req, res) => {
    const result = await smsService.sendSms(req.body, req.userId);
    this.success(res, result);
  });
}

// 3. SERVICE (backend/src/services/smsService.ts)
class SmsService {
  async sendSms(data, userId) {
    // Walidacja
    // Wywołanie API (Twilio)
    // Zapis w bazie
    return { success: true };
  }
}

// 4. REGISTER (backend/src/index.ts)
import smsRoutes from './routes/smsRoutes';
app.use('/api/sms', smsRoutes);
```

**Zalety:**
- ✅ Kod podzielony na małe, zrozumiałe kawałki
- ✅ Reużywalne middleware (auth, logging już gotowe!)
- ✅ Łatwe testowanie (każda warstwa osobno)
- ✅ Single Responsibility Principle

---

## 🎓 Resources

### **Czytaj dalej:**
1. [BACKEND_ARCHITECTURE_EXPLAINED.md](BACKEND_ARCHITECTURE_EXPLAINED.md) - Pełna dokumentacja (PL)
2. [02-request-flow-detailed.puml](docs/uml-diagrams/02-request-flow-detailed.puml) - Diagram sequence
3. [03-patterns-architecture.puml](docs/uml-diagrams/03-patterns-architecture.puml) - Diagram komponentów

### **Generuj diagramy:**
```bash
# Zainstaluj PlantUML
npm install -g node-plantuml

# Generuj obrazy
plantuml docs/uml-diagrams/*.puml
# Output: *.png files
```

---

**🔥 To jest senior-level production architecture. Pragmatyczna, skalowalna i maintainable!**
