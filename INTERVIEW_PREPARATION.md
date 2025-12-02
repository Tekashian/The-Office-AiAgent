# Przygotowanie do Rozmowy Technicznej - AI REV Software Engineer

## Spis Treści
1. [Pytania Ogólno-Techniczne (20)](#pytania-ogólno-techniczne)
2. [Pytania Dotyczące Projektu The-Office-Agent-AI (20)](#pytania-dotyczące-projektu)
3. [Pytania React & TypeScript (20)](#pytania-react--typescript)

---

## Pytania Ogólno-Techniczne

### 1. **Wyjaśnij różnicę między procesem a wątkiem. Jak zarządzasz współbieżnością w aplikacjach?**

**Odpowiedź:**
- **Proces**: niezależna jednostka wykonawcza z własną przestrzenią pamięci
  - Node.js backend = single process (PID)
  - Multiple instances dla horizontal scaling
- **Wątek**: lżejsza jednostka wykonawcza dzieląca pamięć z innymi wątkami
  - Node.js = single-threaded event loop
  - Worker threads dla CPU-intensive tasks (potential)

**Zarządzanie współbieżnością w projekcie**:

1. **Node.js Event Loop** (I/O bound operations):
   ```typescript
   // Non-blocking I/O
   const [emails, pdfs, scrapes] = await Promise.all([
     supabase.from('emails_sent').select(),
     supabase.from('pdf_files').select(),
     supabase.from('scrape_jobs').select(),
   ]);
   ```
   - Async/await dla database queries
   - Event-driven architecture
   - Non-blocking I/O

2. **Promise.all** dla parallel operations:
   ```typescript
   // AgentOrchestrator - multiple API calls
   const results = await Promise.all(
     urls.map(url => scraperService.scrape(url))
   );
   ```

3. **Async Queue Pattern** (potential improvement):
   - RabbitMQ/SQS dla background jobs
   - Worker pattern: multiple consumers
   - Producer: API endpoint dodaje task do queue
   - Consumer: worker process wykonuje task

4. **Database Connection Pooling**:
   - Supabase handles automatically
   - Multiple concurrent queries
   - Connection reuse

5. **Rate Limiting** (prevent overwhelming):
   - Express Rate Limit middleware
   - In-memory store (sliding window)
   - Per-IP limiting

6. **Graceful Degradation**:
   - Timeout limits (30s dla AI calls)
   - Circuit breaker pattern (potential)
   - Retry logic z exponential backoff

**Other Languages Context** (z doświadczenia):
- Go: goroutines + channels (lightweight threads)
- Python: asyncio, threading, multiprocessing
- Message queues: RabbitMQ, Kafka dla distributed systems

---

### 2. **Co to jest CAP theorem i jak wpływa na projektowanie systemów rozproszonych?**

**Odpowiedź:**
- **CAP Theorem**: Consistency, Availability, Partition Tolerance - można wybrać maksymalnie 2 z 3
- W praktyce **partition tolerance jest konieczna** (sieć zawsze może się rozdzielić)
- Wybieramy między:
  - **CP (Consistency)**: silna spójność kosztem availability
  - **AP (Availability)**: zawsze dostępne kosztem eventual consistency

**W projekcie The-Office-Agent-AI**:
- **Supabase PostgreSQL = CP system**:
  - ACID transactions
  - Strong consistency
  - Replikacja z synchronous commit (opcjonalne)
  - Trade-off: downtime podczas network partition
- **Use case**: financial data, user profiles, email configs
  - Wymagamy spójności (nie można mieć 2 różnych wersji email config)

**Eventual Consistency w projekcie**:
- **Supabase Realtime** (AP characteristics):
  - WebSocket subscriptions
  - Może być lag między write a notification
  - Acceptable dla notifications (not critical)
- **Cache layer** (potential Redis):
  - Cache invalidation = eventual consistency
  - TTL-based expiration
  - Acceptable dla dashboard stats

**Examples z innych systemów**:
- **PostgreSQL** (CP): banking, core data
- **Cassandra** (AP): logs, analytics, time-series
- **MongoDB** (tunable): eventual → strong consistency configurable
- **DynamoDB** (AP default): high availability, geo-replication

**Practical Decision**:
- User profiles, email configs: **CP** (strong consistency wymagana)
- Notifications, activity feed: **AP** (eventual consistency OK)
- Dashboard stats: **AP** (cached, eventual consistency acceptable)

---

### 3. **Jak działa garbage collection i jakie ma wpływ na wydajność aplikacji?**

**Odpowiedź:**
**Node.js V8 Engine** (używany w projekcie):

**GC Generations**:
1. **Young Generation** (short-lived objects):
   - Scavenge algorithm (fast, frequent)
   - Request handlers, temporary variables
   - Most objects die here

2. **Old Generation** (long-lived objects):
   - Mark-Sweep-Compact (slower, less frequent)
   - Singletons, services, cached data

**Wpływ na wydajność**:
- **Pauzy GC** (stop-the-world):
  - Young gen: 1-10ms (acceptable)
  - Old gen: 50-200ms (noticeable)
  - Incremental marking zmniejsza pauzy
- **CPU overhead**: 5-15% w typical workload
- **Latency spikes**: P99 latency wzrasta podczas GC

**Monitoring w projekcie**:
```typescript
// utils/performance.ts
export function startMemoryMonitoring(interval: number = 300000) {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    logger.info('Memory usage', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    });
  }, interval);
}

// Enabled w production
if (config.isProduction()) {
  startMemoryMonitoring(300000); // Every 5 minutes
}
```

**Optymalizacja w projekcie**:

1. **Object Pooling** (potential):
   ```typescript
   // Reuse objects zamiast create new
   const bufferPool = new BufferPool();
   ```

2. **Zmniejszenie alokacji**:
   ```typescript
   // Bad: creates array every call
   function getUsers() {
     return users.filter(u => u.active);
   }
   
   // Better: cache result
   const activeUsers = users.filter(u => u.active);
   ```

3. **Streaming dla dużych danych**:
   ```typescript
   // Email attachments: stream zamiast buffer
   const stream = fs.createReadStream(filePath);
   stream.pipe(response);
   ```

4. **Memory Leaks Prevention**:
   - Clear intervals/timeouts
   - Cleanup event listeners
   - Close database connections
   - Remove Supabase subscriptions
   ```typescript
   useEffect(() => {
     const channel = supabase.channel('...');
     channel.subscribe();
     return () => supabase.removeChannel(channel); // Cleanup!
   }, []);
   ```

5. **V8 Flags** (production tuning):
   ```bash
   node --max-old-space-size=4096 dist/index.js  # Increase heap
   node --expose-gc dist/index.js                 # Manual GC access
   ```

**Profiling Tools**:
- Node.js built-in: `node --inspect`
- Chrome DevTools: memory profiler, heap snapshot
- Clinic.js: flame graphs, memory analysis

**Other Languages Context**:
- **Go**: concurrent mark-and-sweep, STW pauses <1ms, pprof profiling
- **Python**: reference counting + cycle detector, manual `gc.collect()`

---

### 4. **Opisz wzorzec CQRS i kiedy warto go zastosować.**

**Odpowiedź:**
- Command Query Responsibility Segregation - oddzielenie operacji zapisu od odczytu
- Zalety: niezależne skalowanie read/write, optymalizacja modeli danych, lepsza wydajność
- Kiedy stosować: systemy o wysokim throughput, różne wymagania dla read/write, event sourcing
- Wyzwania: zwiększona złożoność, eventual consistency, synchronizacja

---

### 5. **Jak zaprojektowałbyś system autentykacji i autoryzacji dla aplikacji mikroserwisowej?**

**Odpowiedź:**
- JWT tokens z refresh tokens dla stateless auth
- OAuth 2.0 / OpenID Connect dla identity provider
- API Gateway z centralną autentykacją
- RBAC/ABAC dla autoryzacji, stored w dedykowanym serwisie
- Service mesh (Istio) dla mTLS między serwisami
- Rate limiting, token rotation, secure storage (Vault)

---

### 6. **Co to jest Database Sharding i jakie są jego zalety/wady?**

**Odpowiedź:**
- Podział danych na mniejsze części (shards) dystrybuowane między serwery
- Zalety: horyzontalne skalowanie, lepsza wydajność, izolacja błędów
- Wady: złożoność zapytań cross-shard, rebalancing, trudniejsze transakcje
- Strategie: hash-based, range-based, geographic sharding
- Stosowane gdy single database nie radzi sobie z obciążeniem

---

### 7. **Wyjaśnij zasadę działania Load Balancera. Jakie znasz algorytmy balansowania?**

**Odpowiedź:**
- Dystrybucja ruchu między wiele instancji aplikacji
- Algorytmy: Round Robin, Least Connections, IP Hash, Weighted Round Robin, Least Response Time
- Layer 4 (TCP) vs Layer 7 (HTTP) load balancing
- Health checks, session persistence (sticky sessions)
- Narzędzia: Nginx, HAProxy, AWS ELB, Kubernetes Service

---

### 8. **Jak monitorujesz wydajność aplikacji w production? Jakie metryki są najważniejsze?**

**Odpowiedź:**
- Metryki: Latency (P50, P95, P99), Throughput (RPS), Error Rate, Saturation
- Golden Signals: Latency, Traffic, Errors, Saturation
- Narzędzia: Prometheus + Grafana, DataDog, New Relic, ELK Stack
- Distributed tracing: Jaeger, Zipkin dla mikroserwisów
- Application Performance Monitoring (APM), logging, alerting

---

### 9. **Co to jest Circuit Breaker pattern i dlaczego jest ważny w mikroserwisach?**

**Odpowiedź:**
- Zapobiega kaskadowym awariom w systemach rozproszonych
- Stany: Closed (normal), Open (failing), Half-Open (testing recovery)
- Automatyczne wykrywanie problemów i fail-fast zamiast timeout
- Retry logic z exponential backoff
- Implementacje: resilience4j (Java), hystrix, własne w Go

---

### 10. **Jak zaprojektowałbyś system kolejkowania zadań z wysokim throughput?**

**Odpowiedź:**
- Message broker: RabbitMQ, Apache Kafka, AWS SQS, Redis Streams
- Worker pattern z konkurencyjnymi konsumentami
- Dead letter queue dla failed messages
- At-least-once vs exactly-once delivery semantics
- Backpressure handling, priority queues
- Monitoring: queue depth, processing time, error rates
- Horizontal scaling workers based on queue size

---

### 11. **Wyjaśnij różnicę między SQL a NoSQL. Kiedy użyłbyś każdego z nich?**

**Odpowiedź:**
- SQL: ACID, relacje, schema, JOIN, PostgreSQL/MySQL
  - Użycie: transakcje finansowe, konsystencja danych, złożone relacje
- NoSQL: flexible schema, horizontal scaling, BASE
  - Document (MongoDB): semi-structured data, CMS
  - Key-Value (Redis): cache, sessions
  - Column (Cassandra): time-series, analytics
  - Graph (Neo4j): social networks, recommendations
- Często używam obu: PostgreSQL dla core data + Redis dla cache

---

### 12. **Co to jest Docker i jak różni się od maszyny wirtualnej?**

**Odpowiedź:**
**Docker vs VM**:

| Aspect | Docker Container | Virtual Machine |
|--------|------------------|------------------|
| Isolation | OS-level (namespaces, cgroups) | Hardware-level (hypervisor) |
| Kernel | Shared host kernel | Own OS kernel |
| Size | 10-100s MB | GBs (full OS) |
| Startup | Seconds | Minutes |
| Resources | Lightweight | Heavy |
| Portability | High (runs anywhere) | Medium (hypervisor dependent) |

**Docker Concepts**:
- **Image**: read-only template (Dockerfile → build → image)
- **Container**: running instance of image
- **Registry**: Docker Hub, private registry
- **Volumes**: persistent data
- **Networks**: container communication

**W projekcie The-Office-Agent-AI** (potential Dockerization):

**Backend Dockerfile**:
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - AI_API_KEY=${AI_API_KEY}
    volumes:
      - ./backend/uploads:/app/uploads
    restart: unless-stopped
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
    restart: unless-stopped
```

**Multi-stage Build Benefits**:
- Smaller final image (no build tools)
- Separate build dependencies
- Layer caching optimization
- Security: minimal attack surface

**Docker Commands**:
```bash
# Build
docker build -t office-agent-backend:latest ./backend

# Run
docker run -p 3001:3001 --env-file .env office-agent-backend

# Compose
docker-compose up -d
docker-compose logs -f backend
docker-compose down
```

**Benefits dla projektu**:
- ✅ Consistent environment (dev = prod)
- ✅ Easy deployment (Railway, AWS ECS)
- ✅ Dependency isolation
- ✅ Version control (image tags)
- ✅ Scalability (Kubernetes ready)

**Kubernetes** (future orchestration):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: office-agent-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
```

**Current State**: 
- ❌ Not Dockerized yet (tech debt)
- Manual deployment (Railway, Vercel)
- Potential for containerization

---

### 13. **Jak implementujesz CI/CD pipeline? Jakie są best practices?**

**Odpowiedź (Prosto):**

**Co to CI/CD?**
- **CI** (Continuous Integration) = Automatyczne testowanie każdej zmiany w kodzie
- **CD** (Continuous Deployment) = Automatyczne wdrażanie na serwer

**3 Kroki Pipeline:**
1. **Build** 📦
   - Kompilacja kodu (TypeScript → JavaScript)
   - Instalacja zależności (npm install)
   - Tworzenie paczki gotowej do uruchomienia

2. **Test** 🧪
   - Unit tests - czy funkcje działają?
   - Integration tests - czy komponenty współpracują?
   - Linting - czy kod jest czysty?
   - Security scan - czy brak dziur bezpieczeństwa?

3. **Deploy** 🚀
   - Wrzucenie na serwer (Railway, Vercel)
   - Uruchomienie nowej wersji
   - Sprawdzenie czy działa (health check)

**Best Practices (Dobre Praktyki):**
- ✅ **Każdy push → automatyczne testy** (GitHub Actions)
- ✅ **Zielony test = automatyczny deploy** (jak test przechodzi → wdrażaj)
- ✅ **Rollback ready** (coś nie działa? → wróć do poprzedniej wersji jednym klikiem)
- ✅ **Secrets w bezpiecznym miejscu** (hasła nie w kodzie, tylko w GitHub Secrets)
- ✅ **Deploy strategies**:
  - **Blue-Green**: masz 2 serwery - nowa wersja idzie na nieaktywny, przełączasz ruch
  - **Canary**: nowa wersja dla 10% użytkowników najpierw, jak działa → reszta
  
**W projekcie (planned):**
```yaml
# GitHub Actions workflow
git push → 
  → npm install
  → npm test (gdy będą testy)
  → npm run build
  → deploy to Railway (backend)
  → deploy to Vercel (frontend)
  → ✅ gotowe!
```

**Narzędzia:**
- GitHub Actions (automatyzacja w repo)
- Railway/Vercel (hosting z auto-deploy)
- Supabase (database - schema migrations)

---

### 14. **Opisz wzorzec Repository i dlaczego jest użyteczny.**

**Odpowiedź (Prosto):**

**Co to Repository Pattern?**
To jak "kelner w restauracji" między Twoim kodem a bazą danych.

**Zamiast:**
```typescript
// Bezpośrednio w kontrolerze (ZŁE)
app.get('/users', (req, res) => {
  const users = supabase.from('users').select('*'); // 😱
  res.json(users);
});
```

**Robisz:**
```typescript
// Repository (warstwa pośrednia)
class UserRepository {
  async findAll() {
    return supabase.from('users').select('*');
  }
  async findById(id) {
    return supabase.from('users').select('*').eq('id', id);
  }
}

// Kontroler (CZYSTO)
app.get('/users', async (req, res) => {
  const users = await userRepo.findAll(); // 😊
  res.json(users);
});
```

**Dlaczego to fajne?**
1. **Łatwe testowanie** 🧪
   - Możesz podmienić prawdziwą bazę na fake'ową w testach
   ```typescript
   const fakeRepo = { findAll: () => [{ id: 1, name: 'Test' }] };
   ```

2. **Zmiana bazy? No problem!** 🔄
   - PostgreSQL → MongoDB? Zmieniasz tylko Repository
   - Reszta kodu nie wie, nie obchodzi

3. **Czysty kod** ✨
   - Kontroler: "Daj mi użytkowników" (CO)
   - Repository: "SELECT * FROM users" (JAK)

**W projekcie:**
- ✅ `BaseService<T>` = nasz własny Repository pattern
- ✅ `UserContextService extends BaseService`
- ⚠️ Tech debt: większość routes robi direct Supabase queries (brak repository)

---

### 15. **Jak zabezpieczasz API przed atakami? (OWASP Top 10)**

**Odpowiedź:**
- Authentication & Authorization (JWT, OAuth2)
- Input validation, sanitization (SQL injection, XSS)
- Rate limiting, throttling (prevent DoS)
- HTTPS/TLS everywhere
- CORS policy, CSP headers
- API versioning
- Logging & monitoring suspicious activity
- Secrets management (nie w kodzie, używam Vault)
- Regular security audits, dependency scanning
- WAF (Web Application Firewall)

---

### 16. **Co to jest Eventual Consistency i gdzie ją stosujesz?**

**Odpowiedź:**
- System ostatecznie osiąga spójność, ale nie natychmiast
- Stosowanie: systemy rozproszone wymagające wysokiej dostępności
- Trade-off między consistency a availability (CAP)
- Przykłady: replicated databases, cache invalidation, CQRS
- Patterns: event sourcing, saga pattern dla distributed transactions
- Monitoring: lag metrics, reconciliation jobs
- Komunikacja z użytkownikiem o asynchronicznych operacjach

---

### 17. **Jak optymalizujesz zapytania do bazy danych?**

**Odpowiedź:**
- Indexing: B-tree, Hash, GIN dla full-text search
- Query planning: EXPLAIN ANALYZE
- Avoiding N+1 queries: eager loading, batching
- Connection pooling
- Denormalizacja gdy potrzebna wydajność
- Materialized views dla complex aggregations
- Partitioning dużych tabel
- Caching (Redis) często używanych danych
- Query timeout limits
- Read replicas dla read-heavy workloads

---

### 18. **Wyjaśnij różnicę między REST a gRPC. Kiedy użyłbyś każdego?**

**Odpowiedź:**
- REST: HTTP/1.1, JSON, text-based, human-readable
  - Użycie: public APIs, web clients, simple CRUD
- gRPC: HTTP/2, Protocol Buffers, binary, bidirectional streaming
  - Użycie: internal microservices, high performance, type safety
- gRPC zalety: mniejsze payloady, code generation, streaming
- REST zalety: szersze wsparcie, easier debugging, no special tooling
- W praktyce: REST dla frontend APIs, gRPC dla backend-to-backend

---

### 19. **Co to jest Idempotency i dlaczego jest ważna w API design?**

**Odpowiedź:**
- Wielokrotne wykonanie tej samej operacji daje ten sam wynik
- HTTP methods: GET, PUT, DELETE są idempotentne; POST nie jest
- Ważne dla: retry logic, network failures, distributed systems
- Implementacja: idempotency keys, checking state before operation
- Zapobiega duplicate charges, double processing
- W payment systems krytyczne: transaction IDs, deduplication
- Client-provided request IDs

---

### 20. **Jak testujesz kod? Jaka jest twoja strategia testowania?**

**Odpowiedź:**
- Test pyramid: unit tests (70%) → integration tests (20%) → e2e tests (10%)
- Unit tests: izolacja, mocking dependencies, fast feedback
- Integration tests: testing with real DB, external services
- E2e tests: critical user flows, UI automation
- TDD gdy to ma sens, szczególnie dla złożonej logiki
- Table-driven tests w Go
- Coverage jako metryka, ale nie cel sam w sobie (aim for 80%+)
- CI/CD integration, parallel test execution
- Contract testing dla mikroserwisów

---

## Pytania Dotyczące Projektu

### 1. **Opisz ogólną architekturę projektu The-Office-Agent-AI. Jakie są główne komponenty?**

**Odpowiedź:**
- **Backend** (Node.js/TypeScript + Express):
  - 13 REST API routes z 70+ endpoints
  - Agent Orchestrator jako centralny hub
  - 8 service layers (AIService, PDFService, ScraperService, CronService, EmailInboxService, UserContextService + BaseService pattern)
  - 5 middleware: auth, errorHandler, rateLimit, requestLogger, validation
- **Frontend** (Next.js 16 App Router + React 19):
  - 12 route pages (agent, email, inbox, pdf, scraper, tasks, notifications, settings)
  - Shadcn/ui component library, Tailwind CSS 4
  - Client/Server Components separation
- **Supabase Stack**:
  - PostgreSQL: 18 tabel z RLS policies
  - Auth: JWT tokens, session management
  - Storage: attachments, PDFs, uploaded files
  - Realtime: WebSocket subscriptions dla notifications
- **External Integrations**:
  - Google Gemini AI (gemini-2.5-flash model)
  - IMAP/SMTP (Gmail, Outlook) dla email inbox
  - Nodemailer dla email sending

---

### 2. **Jak zaimplementowałeś autentykację w projekcie? Jakie mechanizmy bezpieczeństwa stosowałeś?**

**Odpowiedź:**
- **Supabase Auth**: JWT tokens z `supabase.auth.getUser(token)`
- **Middleware auth.ts**: 
  - `authenticateUser` - wymagana autentykacja, dodaje `userId` i `userEmail` do request
  - `optionalAuth` - opcjonalna autentykacja (nie blokuje requestu)
  - Token extraction z `Authorization: Bearer <token>` header
- **Security layers**:
  - Helmet.js: Content Security Policy, security headers
  - CORS: konfiguracja allowed origins, credentials, methods
  - Rate limiting: relaxed (100 req/15min), strict dla AI (10 req/min)
  - Request logging z correlation IDs dla request tracing
  - Compression middleware
- **Database security**:
  - Row Level Security (RLS) policies na wszystkich 18 tabelach
  - Supabase Service Role Key dla admin operations (bypass RLS)
  - Encrypted SMTP credentials (AES-256 w user_email_configs)
- **Input validation**: Zod schemas w validation middleware

---

### 3. **Wyjaśnij jak działa Agent Orchestrator w tym projekcie.**

**Odpowiedź:**
- **Centralny dispatcher**: analizuje intent użytkownika i wybiera odpowiednie tool
- **Tool registry** (5 tools):
  - `send_email` - wysyłanie emaili (integracja z IMAP/SMTP)
  - `generate_pdf` - tworzenie PDF dokumentów
  - `scrape_website` - web scraping (Cheerio)
  - `create_cron_job` - scheduled tasks
  - `conversation` - zwykła konwersacja AI
- **Google Gemini Integration**:
  - Model: gemini-2.5-flash
  - API call przez aiService z temperature 0.7, max 2000 tokens
  - System prompt z tool definitions i language detection (Polish/English)
- **Intent Detection Flow**:
  1. Wykrycie języka (Polish indicators: ą,ć,ę,ł,ń,ó,ś,ź,ż + keywords)
  2. AI decyzja: który tool użyć + reasoning + parameters
  3. Execution: wywołanie odpowiedniej metody (executeSendEmail, executeGeneratePDF, etc.)
  4. Response formatting w języku użytkownika
- **Email execution** (143 linie kodu):
  - Pobiera IMAP config z bazy (encrypted password)
  - Decryption hasła (AES-256)
  - AI enhancement emaila (professional formatting)
  - Dodanie signature z user profile
  - Wysłanie przez nodemailer (Gmail SMTP)
  - Zapis do emails_sent table
- **User Context injection**: preferences, company, signature
- **Error handling**: try-catch z user-friendly messages
- **Logging**: Winston logger z structured logs

---

### 4. **Jak zaprojektowałeś strukturę bazy danych? Opisz główne tabele i relacje.**

**Odpowiedź:**
**Główne tabele (18 total w 7 schema files):**

**Core** (supabase-schema.sql - 7 tabel):
- `user_profiles`: full_name, company, plan (free/pro/enterprise)
- `user_email_configs`: SMTP credentials (encrypted), per-user config
- `emails_sent`: history, status (pending/sent/failed), message_id
- `pdf_files`: generated PDFs, file_path w Supabase Storage
- `scrape_jobs`: URL, status, result_data (JSONB), error_message
- `cron_jobs`: schedule (cron expression), task_type, task_config (JSONB), enabled, last_run
- `chat_messages`: conversation history, role (user/assistant)

**Email System** (3 dodatkowe tabele):
- `email_templates`: subject, body, placeholders, variables (JSONB)
- `email_attachments`: foreign key do templates
- `scheduled_emails`: scheduled send, send_at timestamp
- `user_imap_configs`: IMAP settings (encrypted password)
- `emails_inbox`: fetched messages, raw_content, parsed_data (JSONB)
- `ai_email_drafts`: AI-generated drafts
- `email_scan_logs`: sync history, errors

**Other**:
- `notifications`: type, title, message, read status, link
- `pdf_templates`: reusable templates
- `scrape_history`: scraping logs

**Indeksy**: 11 indexes na user_id, status, enabled, created_at dla query performance

**RLS Policies**: każda tabela ma policies:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

**Foreign Keys**: wszystkie z `ON DELETE CASCADE` dla automatic cleanup

---

### 5. **Jak implementujesz Email Inbox z IMAP? Jakie wyzwania napotkałeś?**

**Odpowiedź:**
- **EmailInboxService** (522 linie kodu):
  - Library: `node-imap` + `mailparser`
  - Connection flow:
    1. Fetch encrypted config z `user_imap_configs` table
    2. Decrypt password (AES-256)
    3. Create IMAP connection z TLS
    4. openBox('INBOX', false) - read-only mode
  - **Scanning strategy**:
    - Search criteria: 'ALL' lub 'UNSEEN'
    - Fetch attributes: uid, flags, internaldate, body structure
    - Stream parsing: mailparser dla headers + body + attachments
  - **Data extraction**:
    - Headers: from, to, subject, date, message-id
    - Body: text, html (both stored)
    - Attachments: download do memory → upload do Supabase Storage → get signed URL
    - Result stored as JSONB w `emails_inbox` table

**Wyzwania i rozwiązania**:
- **Connection stability**: 
  - Timeout 30s, reconnection logic
  - Event handlers: error, end, close
  - Graceful disconnect w cleanup
- **Memory management**: 
  - Streaming attachments zamiast buffer całości
  - Limit rozmiaru attachmentów
- **Rate limiting**: 
  - Respect provider limits (Gmail: 15 req/sec)
  - Exponential backoff dla failed connections
- **Encoding**: 
  - Mailparser automatyczny decode (UTF-8, base64, quoted-printable)
- **Security**:
  - Validate sender, check SPF/DKIM potential
  - Store w encrypted fields
- **Providers support**: Gmail, Outlook, custom IMAP (port 993 SSL, 143 STARTTLS)

---

### 6. **Opisz implementację Email Templates. Jak obsługujesz dynamic content?**

**Odpowiedź:**
- Template engine: Handlebars/Mustache dla variable substitution
- Struktura: subject, body (HTML/plain text), placeholders
- Variables: {{firstName}}, {{companyName}}, itp.
- Preview functionality przed wysłaniem
- Validation: wymagane fields, format checking
- Versioning templates
- A/B testing różnych templates
- Rich text editor w frontend (React)
- Stored w DB, renderowanie on-demand
- Support dla attachments, embedded images

---

### 7. **Jak zaimplementowałeś Web Scraper? Jakie biblioteki użyłeś?**

**Odpowiedź:**
- Puppeteer/Playwright dla dynamic content (JavaScript rendering)
- Cheerio dla static HTML parsing
- Rate limiting, respect robots.txt
- Proxy rotation dla większej skali
- Retry logic z exponential backoff
- Error handling: 404s, timeouts, captcha
- Data extraction: CSS selectors, XPath
- Storage: raw HTML + parsed data
- Scheduling: cron jobs dla periodic scraping
- Monitoring: success rate, scraping duration
- Anti-detection: user agents rotation, delays

---

### 8. **Jak generujesz PDFy? Opisz proces od template do final document.**

**Odpowiedź:**
- **PDFService** używa `pdfkit` library (nie puppeteer)
- **Generation flow** (executeGeneratePDF w AgentOrchestrator):
  1. User request przez AI agent z title + content
  2. Create PDFDocument instance
  3. Buffering: pipe do array, concat chunks
  4. **Content rendering**:
     - Title: fontSize 24, bold font
     - Content: fontSize 12, line breaks respected
     - Dodatkowe: images (optional), tables (manual layout)
  5. **Metadata**: info object (Title, Author, Subject, CreationDate)
  6. doc.end() - finalize
  7. **Storage**:
     - Filename: `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`
     - Upload do Supabase Storage bucket 'pdfs'
     - Public URL generation
  8. **Database record**: insert do `pdf_files` table
     - user_id, title, filename, file_path, file_size, created_at
  9. Return success message z file ID

**Features**:
- **Font support**: Helvetica (default), można dodać custom fonts
- **Page size**: A4 (595.28 x 841.89 points)
- **Text formatting**: 
  - moveDown() dla spacing
  - text() z options (align, width, continued)
- **Images**: doc.image(buffer, options)
- **Security**: RLS - user może access tylko swoje PDFy
- **File size**: tracking w database, limits można dodać
- **Preview**: frontend może fetch public URL od razu
- **Async**: całość async/await, non-blocking

**Tech debt**: brak template system (hardcoded formatting), można dodać template engine

---

### 9. **Jak zarządzasz scheduled tasks (cron jobs) w aplikacji?**

**Odpowiedź:**
- **CronService** używa `node-cron` library
- **Architektura**:
  - In-memory job registry: `Map<string, ScheduledTask>`
  - Each task: { schedule, callback, nodeTask }
  - CRUD operations: createJob, updateJob, deleteJob, listJobs

**Create Job Flow** (przez AgentOrchestrator):
1. User request: "schedule email every Monday at 9am"
2. AI extracts: name, schedule (cron expression), task_type, task_config
3. Insert do `cron_jobs` table (user_id, enabled=true)
4. CronService.createJob():
   - Validate cron expression
   - Create node-cron task: `cron.schedule(schedule, callback)`
   - Callback wykonuje task_type (email/pdf/scraper)
   - Store w in-memory registry
5. Start immediately jeśli enabled=true

**Task Execution**:
- Callback async function:
  - Fetch fresh config z DB
  - Execute based on task_type:
    - `email`: call AgentOrchestrator.executeSendEmail(task_config)
    - `pdf`: call executeGeneratePDF(task_config)
    - `scraper`: call executeScrapeSite(task_config)
  - Update `last_run` timestamp
  - Increment `execution_count`
  - Log success/failure
- **Error handling**: try-catch, error saved to database

**Cron Expression Examples**:
- "0 9 * * 1" = Every Monday at 9am
- "0 */2 * * *" = Every 2 hours
- "0 0 * * *" = Daily at midnight
- "*/15 * * * *" = Every 15 minutes

**Monitoring**:
- `/api/cron` routes: GET all, POST create, DELETE remove
- Frontend dashboard pokazuje: status, last run, execution count
- Failed jobs: error_message w database

**Scalability limitation**: 
- In-memory registry = jobs reset on server restart
- Należy reload jobs z DB on startup
- Brak distributed locks (single instance only)

---

### 10. **Opisz system notyfikacji. Jak dostarczasz notyfikacje użytkownikom?**

**Odpowiedź:**
- In-app notifications: stored w DB, polling/websockets dla real-time
- Toast notifications w UI (React)
- Notification types: info, success, warning, error
- Persistence: read/unread status
- Real-time updates: Supabase Realtime subscriptions
- Możliwość rozszerzenia: email notifications, push notifications
- Filtering, grouping notifications
- Retention policy: auto-cleanup starych notyfikacji
- User preferences: opt-in/opt-out dla różnych typów

---

### 11. **Jak obsługujesz błędy w aplikacji? Opisz error handling strategy.**

**Odpowiedź:**
**Backend Error Architecture**:

**Custom Error Classes** (utils/errors.ts):
```typescript
- BaseError (abstract)
- ValidationError (400) - invalid input
- AuthenticationError (401) - missing/invalid token
- AuthorizationError (403) - insufficient permissions
- NotFoundError (404) - resource not found
- ConflictError (409) - duplicate resource
- RateLimitError (429) - too many requests
- ExternalServiceError (502) - third-party API failures
- InternalServerError (500) - unexpected errors
```

**Error Middleware** (errorHandler.ts):
1. `notFoundHandler`: catches 404 dla undefined routes
2. `errorHandler`: centralized error processing
   - Match error type → appropriate status code
   - Format response: `{success: false, error: type, message, details?}`
   - Log z correlation ID
   - Production: sanitize stack traces
   - Development: full error details

**Logging Strategy** (Winston logger):
- Structured logs: `logger.error(message, {error, userId, correlationId})`
- Log levels: ERROR, WARN, INFO, DEBUG
- Production: JSON format dla log aggregation
- Development: pretty-print z kolorami

**Try-Catch Patterns**:
```typescript
try {
  // operation
} catch (error) {
  logger.error('Operation failed', error);
  throw new ExternalServiceError('ServiceName', error.message);
}
```

**Frontend Error Handling**:
- axios interceptor: catch 401 → redirect to /auth
- Error boundaries dla React component crashes
- User-friendly messages: "Coś poszło nie tak" zamiast stack trace
- Toast notifications dla user feedback

**Graceful Degradation**:
- AI enhancement failure → use original email
- Cache miss → fetch from source
- Optional features fail silently

**Process-level handlers**:
```typescript
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
  process.exit(1);
});
```

---

### 12. **Jak zaimplementowałeś User Context? Co przechowujesz o użytkowniku?**

**Odpowiedź:**
- **UserContextService** extends BaseService (97 linii kodu)

**Data przechowywana w `user_profiles`**:
```typescript
{
  user_id: UUID,
  full_name: string,
  company: string,
  job_title: string,          // dla email signatures
  email_signature: text,      // formatted signature z placeholders
  plan: 'free' | 'pro' | 'enterprise',
  preferences: JSONB {        // flexible schema
    language: 'pl' | 'en',
    timezone: string,
    notification_settings: {...},
    theme: 'light' | 'dark'
  },
  created_at, updated_at
}
```

**Context Injection do AI**:
- `getUserContext(userId)` zwraca formatted string:
```
User Context:
- Name: [full_name]
- Company: [company]
- Position: [job_title]
- Preferences: [JSON.stringify(preferences)]
```
- Automatic injection w `aiService.sendRequest()` gdy `includeContext !== false`
- Prepended do user prompt dla personalization

**Email Signature System**:
- Template z placeholders: `{{name}}`, `{{position}}`, `{{company}}`
- Runtime replacement w AgentOrchestrator przed sending email
- Example:
```
Z poważaniem,
{{name}}
{{position}}
{{company}}
```

**API Endpoints** (`/api/user/context`):
- GET - fetch user context
- POST - create/update context
- DELETE - remove context (GDPR compliance)

**BaseService Pattern**:
- Generic CRUD operations
- Automatic error handling
- Consistent response format
- Validation hooks

**Privacy & Security**:
- RLS policies: user widzi tylko swoje dane
- Nie przechowujemy sensitive data (passwords w encrypted tables)
- User może export/delete przez API
- JSONB dla flexible schema bez migrations

---

### 13. **Jak zapewniasz skalowalność backendu? Jakie pattern'y zastosowałeś?**

**Odpowiedź:**
**Implemented Patterns**:

1. **Stateless API Design**:
   - Brak session storage w memory
   - JWT tokens dla auth (client-side storage)
   - Each request self-contained
   - Horizontal scaling ready

2. **Supabase Connection Pooling**:
   - Supabase handles connection pooling automatically
   - `supabase` client dla user operations (RLS respected)
   - `supabaseAdmin` dla admin operations (bypass RLS)
   - Reuse client instances (singleton pattern)

3. **Rate Limiting** (rateLimit middleware):
   - In-memory store z Express Rate Limit
   - Presets:
     - `relaxed`: 100 req / 15min (default)
     - `strict`: 30 req / 15min
     - `ai`: 10 req / 1min (expensive operations)
   - Per-IP limiting
   - Custom rate limit per route group

4. **Database Optimization**:
   - 11 indexes na hot paths (user_id, status, created_at)
   - JSONB dla flexible data (scrape results, task configs)
   - Selective column fetching: `.select('id, title, status')`
   - RLS policies compiled at database level

5. **Performance Monitoring**:
   - `responseTime` middleware: X-Response-Time header
   - Memory monitoring w production (every 5min)
   - Structured logging z correlation IDs
   - Request/response logging

6. **Compression**:
   - Compression middleware (gzip/deflate)
   - Response size reduction

7. **Async Operations**:
   - Wszystkie DB calls async/await
   - Non-blocking I/O
   - Promise.all dla parallel operations

8. **Graceful Shutdown**:
```typescript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server');
  setTimeout(() => process.exit(0), 10000); // 10s grace period
});
```

9. **Config Management**:
   - Centralized Config class (singleton)
   - Environment-based settings
   - Validation on startup

**Limitations (Tech Debt)**:
- ❌ No Redis cache (Supabase direct queries)
- ❌ No message queue (synchronous task execution)
- ❌ No distributed cron (in-memory registry)
- ❌ Rate limiting in-memory (reset on restart)

**Ready for Scale**:
- ✅ Deploy multiple instances (stateless)
- ✅ Add Redis dla cache + rate limiting persistence
- ✅ Add RabbitMQ/SQS dla background jobs
- ✅ Supabase scales automatically

---

### 14. **Opisz strukturę routes w backendzie. Jak organizujesz endpoints?**

**Odpowiedź:**
**13 Route Modules** w `backend/src/routes/`:

1. **agentRoutes.ts** - `/api/agent`
   - POST `/chat` - AI conversation
   - POST `/action` - execute tool (email, pdf, scraper, cron)

2. **aiRoutes.ts** - `/api/ai` (rate limit: 10/min)
   - POST `/chat` - direct Gemini API access
   - POST `/generate` - text generation

3. **emailRoutes.ts** - `/api/email`
   - POST `/send` - send email through configured SMTP
   - GET `/history` - sent emails history

4. **emailInboxRoutes.ts** - `/api/email-inbox`
   - POST `/scan` - fetch IMAP messages
   - GET `/` - list inbox messages
   - GET `/:id` - get single message
   - DELETE `/:id` - delete message

5. **emailConfigRoutes.ts** - `/api/email-config`
   - POST `/` - save SMTP/IMAP config
   - GET `/` - get user configs
   - DELETE `/:id` - remove config

6. **emailTemplateRoutes.ts** - `/api/email-templates`
   - POST `/` - create template
   - GET `/` - list templates
   - GET `/:id` - get template
   - PUT `/:id` - update template
   - DELETE `/:id` - delete template

7. **pdfRoutes.ts** - `/api/pdf`
   - POST `/generate` - create PDF
   - GET `/` - list PDFs
   - GET `/:id` - get PDF metadata
   - DELETE `/:id` - delete PDF

8. **scraperRoutes.ts** - `/api/scraper`
   - POST `/scrape` - start scraping job
   - GET `/jobs` - list scrape jobs
   - GET `/jobs/:id` - get job result

9. **cronRoutes.ts** - `/api/cron`
   - POST `/` - create cron job
   - GET `/` - list jobs
   - PUT `/:id` - update job
   - DELETE `/:id` - delete job

10. **userContextRoutes.ts** - `/api/user/context`
    - GET `/` - get user context
    - POST `/` - save user context
    - PUT `/` - update context

11. **notificationRoutes.ts** - `/api/notifications`
    - GET `/` - list notifications
    - POST `/` - create notification
    - PATCH `/:id/read` - mark as read
    - DELETE `/:id` - delete notification

12. **dashboardRoutes.ts** - `/api/dashboard`
    - GET `/stats` - overview statistics
    - GET `/activity` - recent activity
    - GET `/usage` - usage metrics

13. **searchRoutes.ts** - `/api/search`
    - GET `/` - search across all resources

**Routing Conventions**:
- RESTful design: GET (read), POST (create), PUT (update), DELETE (remove)
- Auth middleware applied globally (except `/health`)
- Rate limiting per route: default relaxed, AI strict
- Response format: `{success: boolean, data?: any, message?: string}`
- Error handling przez errorHandler middleware
- Input validation przez validation middleware (Zod schemas)
- CORS enabled dla allowed origins

**Missing Versioning**: brak `/api/v1` - możliwe do dodania w przyszłości

---

### 15. **Jak testujesz integrację z external services (Supabase, Email providers, AI APIs)?**

**Odpowiedź:**
**Obecny stan (Tech Debt)**:
- ❌ **Brak automated tests** - `"test": "echo \"Error: no test specified\" && exit 1"`
- Testing obecnie manualny w development environment

**Planowana strategia testowania**:

**Unit Tests** (do implementacji):
```typescript
// Jest + ts-jest
import { AIService } from './aiService';

jest.mock('axios');

test('AIService.sendRequest should call Gemini API', async () => {
  const mockResponse = {
    candidates: [{ content: { parts: [{ text: 'response' }] } }]
  };
  axios.post.mockResolvedValue({ data: mockResponse });
  
  const result = await aiService.sendRequest({
    prompt: 'test',
    userId: 'user-123'
  });
  
  expect(result.content).toBe('response');
});
```

**Integration Tests** (z Supabase Local):
- Supabase CLI: `supabase start` (local Docker containers)
- Test database z seed data
- Real Supabase client calls (nie mocks)
```typescript
test('Should create user profile', async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({ user_id: testUserId, full_name: 'Test User' });
  expect(error).toBeNull();
  expect(data).toBeDefined();
});
```

**API Mocking**:
- **MSW** (Mock Service Worker) dla external APIs
- Mock Gemini API responses
- Mock SMTP/IMAP w tests

**E2E Tests** (Playwright potential):
- Critical flows: signup → configure email → send email
- Agent interactions
- PDF generation end-to-end

**Test Coverage Goals**:
- Services: 80%+ (business logic)
- Routes: 70%+ (API contracts)
- Utils: 90%+ (pure functions)
- Integration: critical paths only

**Development Dependencies** (do dodania):
```json
"jest": "^29.0.0",
"ts-jest": "^29.0.0",
"@types/jest": "^29.0.0",
"supertest": "^6.0.0",  // API testing
"msw": "^2.0.0"         // API mocking
```

**Environment Variables dla Testów**:
- `.env.test` z test credentials
- Sandbox accounts dla Gmail, Gemini
- Test Supabase project

**CI/CD Integration** (future):
- GitHub Actions workflow
- Run tests on PR
- Coverage reports

---

### 16. **Jak zaprojektowałeś frontend architecture? Opisz folder structure.**

**Odpowiedź:**
**Next.js 16 App Router** (React 19, Tailwind 4)

**Directory Structure**:
```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout (Supabase provider)
│   ├── page.tsx           # Home/dashboard
│   ├── globals.css        # Tailwind imports
│   ├── agent/             # AI chat interface
│   │   └── page.tsx
│   ├── auth/              # Login/signup
│   │   └── page.tsx
│   ├── email/             # Email management
│   │   └── page.tsx
│   ├── email-inbox/       # IMAP inbox viewer
│   │   └── page.tsx
│   ├── pdf/               # PDF generator
│   │   └── page.tsx
│   ├── scraper/           # Web scraping interface
│   │   └── page.tsx
│   ├── tasks/             # Cron jobs dashboard
│   │   └── page.tsx
│   ├── notifications/     # Notification center
│   │   └── page.tsx
│   └── settings/          # User settings
│       └── page.tsx
│
├── components/
│   ├── layout/            # Navigation, Sidebar, Header
│   │   ├── Navigation.tsx
│   │   └── Sidebar.tsx
│   ├── ui/                # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── agent/             # Agent-specific components
│   ├── email/             # Email components
│   ├── pdf/               # PDF components
│   ├── scraper/           # Scraper components
│   ├── tasks/             # Task components
│   ├── notifications/     # Notification components
│   └── NotificationProvider.tsx  # Real-time provider
│
├── lib/
│   ├── api.ts             # Axios client z interceptors
│   ├── auth.ts            # Supabase auth helpers
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # cn() helper, formatters
│
├── context/
│   └── pdfRefreshContext.tsx  # PDF list refresh trigger
│
├── types/
│   └── index.ts           # TypeScript interfaces
│
├── public/                # Static assets
└── package.json
```

**Key Design Decisions**:

1. **File-based Routing**: 
   - `app/agent/page.tsx` → `/agent`
   - No manual route configuration
   - Nested layouts automatic

2. **Component Organization**:
   - `/components/layout` - shared layout components
   - `/components/ui` - reusable primitives (Shadcn)
   - `/components/{domain}` - feature-specific components

3. **Shadcn/ui** (not npm package):
   - Copy-paste component library
   - Full customization
   - Tailwind CSS + Radix UI primitives

4. **API Layer**:
   - Centralized axios client w `lib/api.ts`
   - Interceptors: auth token injection, error handling
   - Base URL: `NEXT_PUBLIC_API_URL`

5. **Type Safety**:
   - Shared types w `types/index.ts`
   - TypeScript strict mode
   - Interface dla API responses

6. **Separation of Concerns**:
   - Pages: routing + layout
   - Components: UI logic
   - Lib: utilities + external services
   - Context: global state

**Server vs Client Components**:
- Pages default Server Components
- Interactive components: `'use client'` directive
- Form components, event handlers = Client
- Static content, data fetching = Server

---

### 17. **Jak implementujesz real-time features w aplikacji?**

**Odpowiedź:**
**Supabase Realtime** (PostgreSQL Change Data Capture)

**NotificationProvider Implementation**:
```typescript
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function NotificationProvider({ children, userId }) {
  const router = useRouter();
  
  useEffect(() => {
    if (!userId) return;
    
    // Subscribe to notifications table
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload.new);
          // Show toast notification
          toast({
            title: payload.new.title,
            description: payload.new.message,
          });
          // Trigger re-fetch
          router.refresh();
        }
      )
      .subscribe();
    
    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);
  
  return <>{children}</>;
}
```

**Subscription Events**:
- `INSERT` - new row created
- `UPDATE` - row modified
- `DELETE` - row removed
- `*` - all events

**Filter Syntax**:
- `filter: "user_id=eq.${userId}"` - only user's data
- RLS applies to subscriptions too

**Real-time Use Cases**:
1. **Notifications**: instant alerts gdy backend tworzy notification
2. **Email Inbox**: live updates gdy nowy email zeskanowany
3. **Cron Job Status**: monitoring execution w real-time
4. **Scraper Progress**: status updates podczas scrapingu

**Connection Management**:
- WebSocket connection automatyczny przez Supabase client
- Automatic reconnection on disconnect
- Heartbeat ping/pong
- Connection pooling

**Performance Optimization**:
- **Selective subscriptions**: tylko niezbędne tabele
- **User-specific filters**: redukuje messages
- **Cleanup on unmount**: `removeChannel()` zapobiega memory leaks
- **Debouncing**: multiple rapid updates → single UI update

**Optimistic Updates Pattern**:
```typescript
// Update UI immediately
setData(prev => [...prev, newItem]);

// Then sync with server
try {
  await apiClient.post('/api/resource', newItem);
  // Real-time subscription confirms insert
} catch (error) {
  // Rollback UI on error
  setData(prev => prev.filter(item => item.id !== newItem.id));
}
```

**Alternative: Polling** (fallback):
- Supabase Realtime wymaga WebSocket support
- Mobile apps, restrictive networks → polling co 5-10s
- Less efficient ale universal compatibility

**Presence Tracking** (potential feature):
- "Who's online" functionality
- Collaborative editing
- Supabase Presence API

---

### 18. **Jak zarządzasz state w React aplikacji?**

**Odpowiedź:**
**Hybrid Approach** (bez Redux/Zustand):

**1. Local State** (useState):
```typescript
// Component-specific state
const [isLoading, setIsLoading] = useState(false);
const [emails, setEmails] = useState<Email[]>([]);
const [error, setError] = useState<string | null>(null);
```
- Form inputs
- UI state (modals, dropdowns)
- Component data

**2. React Context** (global state):

**NotificationProvider** (components/NotificationProvider.tsx):
```typescript
const NotificationContext = createContext({
  notifications: [],
  addNotification: (n) => {},
  markAsRead: (id) => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  
  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('notifications')
      .on('postgres_changes', { event: 'INSERT', ... }, handler)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);
  
  return (
    <NotificationContext.Provider value={{...}}>
      {children}
    </NotificationContext.Provider>
  );
}
```

**PDFRefreshContext** (context/pdfRefreshContext.tsx):
```typescript
const PDFRefreshContext = createContext({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function PDFRefreshProvider({ children }) {
  const [trigger, setTrigger] = useState(0);
  
  const triggerRefresh = () => setTrigger(prev => prev + 1);
  
  return (
    <PDFRefreshContext.Provider value={{ refreshTrigger: trigger, triggerRefresh }}>
      {children}
    </PDFRefreshContext.Provider>
  );
}

// Usage w PDF list component
const { refreshTrigger } = usePDFRefresh();
useEffect(() => {
  fetchPDFs();
}, [refreshTrigger]);
```

**3. Server State** (Supabase queries):
```typescript
// Direct Supabase queries w components
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```
- Brak React Query/SWR (potential improvement)
- Manual refetching z useEffect
- Real-time subscriptions auto-update

**4. URL State** (Next.js router):
```typescript
const searchParams = useSearchParams();
const page = searchParams.get('page') || '1';
```
- Pagination state
- Filters
- Selected IDs

**State Colocation**:
- Keep state close to where it's used
- Only lift up when multiple components need it
- Avoid prop drilling z Context

**Immutable Updates**:
```typescript
// Spread operator dla arrays
setItems(prev => [...prev, newItem]);

// Object updates
setUser(prev => ({ ...prev, name: newName }));
```

**Performance Optimization**:
```typescript
// Memoize expensive calculations
const filteredItems = useMemo(
  () => items.filter(item => item.status === filter),
  [items, filter]
);

// Memoize callbacks
const handleClick = useCallback(
  (id) => deleteItem(id),
  [deleteItem]
);
```

**Why No Redux?**
- App nie wymaga complex state machine
- Context + local state wystarczające
- Mniejszy bundle size
- Prostsze onboarding

**Potential Improvements**:
- Add React Query dla server state caching
- Add Zustand dla complex client state
- Add form library (React Hook Form)

---

### 19. **Opisz proces deployment. Jak wdrażasz zmiany na production?**

**Odpowiedź:**
**Obecny Stan** (Development/Manual Deployment):

**Git Workflow**:
```bash
git add .
git commit -m "Feature: description"
git push origin master
```
- Single branch deployment (master)
- No feature branches yet (tech debt)
- Manual commits

**Backend Deployment Options**:
1. **Railway** (recommended):
   - Connect GitHub repo
   - Auto-deploy on push to master
   - Environment variables w dashboard
   - `npm run build` → `npm start`
   - Health checks: GET /health endpoint

2. **Heroku**:
   - `git push heroku master`
   - Procfile: `web: npm start`
   - Add-ons: Heroku Postgres (if not using Supabase)

3. **VPS** (DigitalOcean, AWS EC2):
   - SSH deployment
   - PM2 process manager
   - Nginx reverse proxy
   - Let's Encrypt SSL

**Frontend Deployment**:
- **Vercel** (native Next.js support):
  - Connect GitHub repo
  - Auto-deploy on push
  - Preview deployments dla PRs
  - Edge network (CDN)
  - Environment variables: `NEXT_PUBLIC_API_URL`

**Database (Supabase)**:
- Hosted PostgreSQL (no deployment needed)
- Schema changes:
  ```bash
  supabase db push  # Push migrations
  supabase db pull  # Pull remote schema
  ```
- SQL Editor w Supabase dashboard
- Migration files w projekcie (*.sql)

**Environment Variables**:

**Backend** (.env):
```
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
AI_API_KEY=AIzaSyxxx...
AI_API_URL=https://generativelanguage.googleapis.com/v1beta/...
AI_MODEL=gemini-2.5-flash
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
ENCRYPTION_KEY=32-byte-hex-key
```

**Frontend** (.env.local):
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

**Planned CI/CD** (GitHub Actions):
```yaml
name: CI/CD
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test  # gdy testy będą
      - run: npm run lint
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    steps:
      - name: Deploy to Railway
        run: railway up
```

**Health Checks**:
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
```

**Rollback Strategy**:
- Railway: revert to previous deployment
- Vercel: instant rollback w dashboard
- Git: `git revert` + push

**Zero-Downtime Deployment**:
- Railway: rolling updates
- Graceful shutdown w code (SIGTERM handler)
- 10s grace period dla in-flight requests

**Monitoring Post-Deploy**:
- Railway logs
- Supabase dashboard (query performance)
- Manual smoke tests
- Potential: Sentry dla error tracking

---

### 20. **Jakie usprawnienia/features chciałbyś dodać do projektu w przyszłości?**

**Odpowiedź:**
**Tech Debt & Improvements**:

**1. Testing Infrastructure** (⭐ High Priority)
- Jest + ts-jest setup
- Unit tests dla services (80%+ coverage)
- Integration tests z Supabase local
- E2E tests z Playwright
- CI/CD integration

**2. Caching Layer** (⭐ High Priority)
- Redis dla:
  - Rate limiting persistence (obecnie in-memory)
  - API response caching
  - Session storage
  - Cron job registry (survive restarts)
- Cache invalidation strategy
- TTL configuration per resource

**3. Background Job Queue** (⭐ High Priority)
- RabbitMQ lub AWS SQS
- Async task processing:
  - Email sending (don't block HTTP response)
  - PDF generation
  - Web scraping
  - Bulk operations
- Retry logic z exponential backoff
- Dead letter queue
- Job monitoring dashboard

**4. EmailService Refactoring** (⚠️ Critical)
- **Problem**: EmailService (65 lines) completely unused
- **Solution**: Refactor AgentOrchestrator (143-line email logic) to use EmailService
- Centralize nodemailer configuration
- Reusable send methods
- Better error handling

**5. Enhanced AI Capabilities**:
- **Multi-model support**: 
  - Google Gemini (current)
  - OpenAI GPT-4
  - Anthropic Claude
  - Model selection per request
- **Context memory**: 
  - Conversation history beyond single session
  - Long-term user preferences learning
- **Function calling**: native Gemini function calling (zamiast custom tool parsing)
- **Streaming responses**: Server-Sent Events dla real-time AI output

**6. Advanced Email Features**:
- **Email threads**: group conversations
- **Smart replies**: AI-suggested responses
- **Auto-categorization**: tags, folders, priority
- **Search**: full-text search w inbox
- **Filters & rules**: auto-actions based on conditions
- **OAuth2 flow**: proper Google/Microsoft auth (nie app passwords)

**7. Collaboration Features**:
- **Workspaces**: team accounts
- **Shared templates**: email, PDF templates shared w team
- **Role-based access**: admin, member, viewer
- **Activity feed**: team activity log
- **Comments**: na scraper results, PDFs

**8. Analytics & Monitoring** (⭐ High Priority):
- **Dashboard metrics**:
  - API usage stats
  - Token consumption tracking
  - Cost per user
  - Feature usage heatmap
- **Performance monitoring**:
  - Response time trends
  - Error rate alerting
  - Database query performance
- **Business metrics**:
  - User retention
  - Feature adoption
  - Conversion funnel

**9. Mobile App**:
- React Native
- Push notifications
- Offline support
- Camera integration (document scanning)

**10. Internationalization**:
- i18next setup
- Language files (pl, en, de, es)
- Currency, date, number formatting
- RTL support potential

**11. Security Enhancements**:
- **2FA**: Time-based OTP
- **API key management**: per-user API keys
- **Audit logs**: who did what when
- **IP whitelisting**: restrict access by IP
- **Webhook signatures**: verify webhook authenticity

**12. Developer Experience**:
- **API documentation**: Swagger/OpenAPI spec
- **SDK generation**: TypeScript SDK dla external developers
- **Webhooks**: notify external systems on events
- **GraphQL API**: alternative to REST

**13. Infrastructure**:
- **Docker**: containerize backend + frontend
- **Kubernetes**: orchestration dla scalability
- **Terraform**: Infrastructure as Code
- **Multi-region**: geo-distributed deployment

**14. Advanced Scraping**:
- **Headless browser pool**: Puppeteer cluster
- **CAPTCHA solving**: integration z 2captcha
- **Proxy rotation**: residential proxies
- **Rate limiting compliance**: respect robots.txt, crawl-delay
- **Data extraction templates**: reusable selectors

**15. PDF Enhancements**:
- **Template system**: WYSIWYG editor
- **Digital signatures**: sign PDFs
- **Form filling**: populate PDF forms
- **OCR**: extract text from scanned PDFs
- **Batch generation**: multiple PDFs at once

**Prioritization**:
1. 🔴 Critical: EmailService refactoring, Testing
2. 🟠 High: Caching, Background jobs, Analytics
3. 🟡 Medium: AI enhancements, Collaboration
4. 🟢 Low: Mobile app, GraphQL, Multi-region

---

## Pytania React & TypeScript

### 1. **Wyjaśnij różnicę między useState, useEffect, useRef, useMemo i useCallback.**

**Odpowiedź:**
- **useState**: zarządzanie local state, triggers re-render on change
- **useEffect**: side effects (API calls, subscriptions), runs after render, cleanup function
- **useRef**: mutable value bez re-render, DOM element reference, persists across renders
- **useMemo**: memoizacja expensive computations, recompute only when dependencies change
- **useCallback**: memoizacja funkcji, prevents recreation on every render, useful dla child components z React.memo
- Przykłady użycia: useEffect dla data fetching, useMemo dla filtrowania dużych list, useCallback dla event handlers

---

### 2. **Co to jest TypeScript i jakie są jego główne zalety?**

**Odpowiedź:**
- **Superset JavaScript** z static typing, compilation do JS
- **Zalety w projekcie**:
  - **Type safety**: catch errors at compile time
    ```typescript
    // Backend
    interface AIRequestConfig {
      prompt: string;
      userId?: string;
      temperature?: number;
      maxTokens?: number;
      includeContext?: boolean;
    }
    ```
  - **Better IDE support**: VSCode autocomplete, IntelliSense
  - **Refactoring**: rename symbols safely across files
  - **Self-documenting**: interfaces zamiast comments
    ```typescript
    async sendRequest(config: AIRequestConfig): Promise<AIResponseData>
    ```
  - **Interface contracts**: frontend-backend agreement
- **TypeScript 5.9** w projekcie (latest)
- **Strict mode** enabled w tsconfig.json
- **Features used**:
  - Generics: `BaseService<T>`
  - Union types: `status: 'pending' | 'sent' | 'failed'`
  - Type guards: `if (error instanceof AuthenticationError)`
  - Utility types: `Partial<User>`, `Omit<Email, 'password'>`
  - Async/await z Promise types
- **Gradual adoption**: `any` type dla rapid prototyping, refactor later
- **Type inference**: TypeScript often nie wymaga explicit types
  ```typescript
  const result = await apiClient.get('/api/user'); // type inferred
  ```

---

### 3. **Opisz React component lifecycle. Jak różni się w class vs functional components?**

**Odpowiedź:**
- **Class components**: componentDidMount, componentDidUpdate, componentWillUnmount
- **Functional components**: useEffect hook covers all lifecycle phases
  ```typescript
  useEffect(() => {
    // componentDidMount + componentDidUpdate
    return () => {
      // componentWillUnmount
    };
  }, [deps]); // dependencies array
  ```
- Empty deps array [] = componentDidMount only
- No deps = runs on every render
- Modern: prefer functional components + hooks

---

### 4. **Co to jest Context API i kiedy go używasz zamiast props drilling?**

**Odpowiedź:**
- Global state sharing bez passing props przez wszystkie levels
- Tworzenie: createContext, Provider component
- Konsumpcja: useContext hook
- Użycie: auth state, theme, language, global settings
- Kiedy używać: data needed w wielu miejscach, głęboko zagnieżdżone komponenty
- Performance consideration: split contexts, memoization
- Alternative: Zustand, Jotai dla complex state
- W projekcie: NotificationProvider, potential AuthContext

---

### 5. **Wyjaśnij różnicę między interface a type w TypeScript.**

**Odpowiedź:**
- **Interface**: deklaracja kształtu obiektu, może być extended, merged
  ```typescript
  interface User {
    id: string;
    name: string;
  }
  interface Admin extends User {
    role: 'admin';
  }
  ```
- **Type**: alias dla dowolnego typu, unions, intersections, primitives
  ```typescript
  type ID = string | number;
  type User = {id: ID; name: string};
  type Admin = User & {role: 'admin'};
  ```
- Interface: better dla object shapes, OOP style
- Type: more flexible, complex types
- W praktyce często zamienne dla object types

---

### 6. **Jak implementujesz formularze w React? Controlled vs Uncontrolled components.**

**Odpowiedź:**
- **Controlled**: React state drives input value, onChange updates state
  ```typescript
  const [value, setValue] = useState('');
  <input value={value} onChange={(e) => setValue(e.target.value)} />
  ```
- **Uncontrolled**: DOM trzyma state, useRef dla access
  ```typescript
  const inputRef = useRef<HTMLInputElement>(null);
  <input ref={inputRef} />
  ```
- Prefer controlled dla validation, conditional rendering
- Libraries: React Hook Form, Formik dla complex forms
- Validation: client-side (yup, zod), server-side
- Form submission: preventDefault, API call, loading state, error handling

---

### 7. **Co to jest React.memo, useMemo i jak optymalizujesz performance w React?**

**Odpowiedź:**
- **React.memo**: HOC memoizing component, prevents re-render if props unchanged
- **useMemo**: memoize values, expensive calculations
- **useCallback**: memoize functions
- **Performance optimization**:
  - Avoid inline functions w JSX (use useCallback)
  - Code splitting (React.lazy, Suspense)
  - Virtualization dla długich list (react-window)
  - Debouncing search inputs
  - Image optimization (Next.js Image)
  - Profiler tool, React DevTools
- Don't optimize prematurely - measure first

---

### 8. **Opisz async/await w TypeScript i jak obsługujesz błędy.**

**Odpowiedź:**
```typescript
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data: User = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error; // re-throw lub handle gracefully
  }
}
```
- async function returns Promise
- await pauses execution, unwraps Promise
- Try-catch dla error handling
- Type annotations dla Promise return types
- Promise.all dla concurrent requests
- Abort controllers dla cancellation

---

### 9. **Co to są Generic types w TypeScript? Podaj przykłady użycia.**

**Odpowiedź:**
```typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Generic interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Generic component
interface Props<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}
function List<T>({ items, renderItem }: Props<T>) {
  return <>{items.map(renderItem)}</>;
}

// Usage
const response: ApiResponse<User> = await fetchUser();
```
- Reusable kod for different types
- Type safety preserved
- Common w API responses, collections, utilities

---

### 10. **Jak implementujesz routing w Next.js App Router?**

**Odpowiedź:**
**Next.js 16 App Router** (file-based routing)

**Route Definition**:
```
app/
├── page.tsx              # / (home)
├── layout.tsx           # root layout (wraps all pages)
├── agent/
│   └── page.tsx         # /agent
├── email/
│   └── page.tsx         # /email
├── email-inbox/
│   └── page.tsx         # /email-inbox
└── settings/
    └── page.tsx         # /settings
```

**Dynamic Routes** (potential):
```
app/
└── pdf/
    ├── page.tsx         # /pdf (list)
    └── [id]/
        └── page.tsx     # /pdf/123 (detail)

// Access param:
export default function PDFDetail({ params }: { params: { id: string } }) {
  const pdfId = params.id;
}
```

**Layouts** (nested):
```typescript
// app/layout.tsx (root)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>  {/* Supabase, Notifications */}
          {children}
        </Providers>
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx (shared dla dashboard pages)
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

**Route Groups**: `(dashboard)` - folder nie wpływa na URL

**Special Files**:
- `loading.tsx` - loading UI podczas fetch
- `error.tsx` - error boundary
- `not-found.tsx` - 404 page

**Navigation**:
```typescript
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Declarative
<Link href="/agent">Go to Agent</Link>

// Programmatic
const router = useRouter();
router.push('/email');
router.back();
router.refresh(); // re-fetch server components
```

**Server vs Client Components**:
- `page.tsx` default = Server Component
- Add `'use client'` dla interactivity
```typescript
'use client';

import { useState } from 'react';

export default function AgentPage() {
  const [messages, setMessages] = useState([]);
  // ...
}
```

**Metadata API** (SEO):
```typescript
export const metadata = {
  title: 'AI Agent - Office Assistant',
  description: 'Chat with AI to automate office tasks',
};
```

**Middleware** (potential):
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Auth check, redirects, etc.
}
```

**Advantages**:
- ✅ No manual route config
- ✅ Automatic code splitting
- ✅ Nested layouts easy
- ✅ Server Components by default (performance)

---

### 11. **Wyjaśnij różnicę między Server Components a Client Components w Next.js.**

**Odpowiedź:**
**Server Components** (default w Next.js 16 App Router):
```typescript
// app/dashboard/page.tsx
import { supabase } from '@/lib/supabase';

export default async function DashboardPage() {
  // Direct database query on server
  const { data: stats } = await supabase
    .from('emails_sent')
    .select('count')
    .eq('status', 'sent');
  
  return <div>Emails sent: {stats?.count}</div>;
}
```
**Characteristics**:
- ✅ Render on server only
- ✅ Zero JavaScript sent to client (smaller bundle)
- ✅ Direct database/API access (no CORS)
- ✅ Secure: API keys, secrets safe
- ✅ SEO friendly (HTML ready)
- ❌ Cannot use hooks (useState, useEffect)
- ❌ Cannot use browser APIs
- ❌ No event handlers (onClick, onChange)

**Client Components** ('use client' directive):
```typescript
'use client';

import { useState } from 'react';

export default function AgentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const handleSend = async () => {
    // API call to backend
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input }),
    });
  };
  
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```
**Characteristics**:
- ✅ Interactive (useState, useEffect)
- ✅ Event handlers (onClick, onSubmit)
- ✅ Browser APIs (localStorage, window)
- ✅ Third-party libraries using hooks
- ❌ Larger bundle size
- ❌ No direct server access

**Composition Patterns**:

**Pattern 1**: Server component wraps client component
```typescript
// app/page.tsx (Server)
import ClientWidget from '@/components/ClientWidget';

export default async function Page() {
  const data = await fetchServerData();
  
  return (
    <div>
      <h1>Server rendered</h1>
      <ClientWidget initialData={data} />  {/* Pass as props */}
    </div>
  );
}
```

**Pattern 2**: Client component imports server component as children
```typescript
// ClientLayout.tsx
'use client';

export default function ClientLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div>
      <button onClick={() => setCollapsed(!collapsed)}>Toggle</button>
      {!collapsed && children}  {/* children can be Server Components */}
    </div>
  );
}
```

**W projekcie The-Office-Agent-AI**:
- **Server**: page.tsx files (data fetching)
- **Client**: 
  - NotificationProvider (WebSocket subscriptions)
  - Forms (input handling)
  - Agent chat (interactive messaging)
  - Modals, dropdowns (UI state)

**Best Practice**:
1. Start z Server Components
2. Add 'use client' only when needed:
   - useState, useEffect, useContext
   - Event handlers
   - Browser-only APIs
3. Keep client components small and deep in tree
4. Pass server data as props

**Performance Impact**:
- Server Components: ~0 KB JavaScript
- Client Component: +bundle size (React, dependencies)
- Next.js automatically optimizes (code splitting)

---

### 12. **Jak obsługujesz API calls w React? Opisz best practices.**

**Odpowiedź:**
**Centralized API Client** (`lib/api.ts`):

```typescript
import axios from 'axios';
import { getAccessToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - inject auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API Request:', config.method, config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);
    
    // Auto-redirect on 401
    if (error.response?.status === 401) {
      window.location.href = '/auth';
    }
    
    return Promise.reject(error);
  }
);
```

**Usage Pattern** (w komponencie):
```typescript
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

interface Email {
  id: string;
  subject: string;
  recipient: string;
  status: string;
}

export default function EmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchEmails() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/api/email/history', {
          signal: controller.signal,
        });
        
        setEmails(response.data.data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.response?.data?.message || 'Failed to fetch emails');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchEmails();
    
    // Cleanup: cancel pending request
    return () => controller.abort();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {emails.map(email => (
        <li key={email.id}>{email.subject}</li>
      ))}
    </ul>
  );
}
```

**POST Request** (send email):
```typescript
const handleSendEmail = async (formData: EmailForm) => {
  try {
    setLoading(true);
    
    const response = await apiClient.post('/api/email/send', {
      to: formData.recipients,
      subject: formData.subject,
      body: formData.body,
    });
    
    if (response.data.success) {
      toast.success('Email sent successfully!');
      router.push('/email');
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to send email');
  } finally {
    setLoading(false);
  }
};
```

**Best Practices Implemented**:

1. ✅ **Centralized client**: jedna konfiguracja dla wszystkich calls
2. ✅ **Interceptors**: automatic token injection, error handling
3. ✅ **AbortController**: cancel pending requests on unmount
4. ✅ **Loading state**: user feedback
5. ✅ **Error state**: display errors
6. ✅ **TypeScript**: typed requests/responses
7. ✅ **Timeout**: 30s limit zapobiega hanging requests
8. ✅ **Logging**: console dla debugging (remove w production)

**Potential Improvements**:
- ❌ Add **React Query** (TanStack Query):
  ```typescript
  const { data, isLoading, error } = useQuery({
    queryKey: ['emails'],
    queryFn: () => apiClient.get('/api/email/history'),
  });
  ```
  - Automatic caching
  - Background refetching
  - Deduplication
  - Optimistic updates

- ❌ Add **SWR** (alternative):
  ```typescript
  const { data, error } = useSWR('/api/email/history', fetcher);
  ```

**Auth Token Helper** (`lib/auth.ts`):
```typescript
import { supabase } from './supabase';

export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
```

---

### 13. **Co to jest TypeScript Union Type i Type Guard?**

**Odpowiedź:**
```typescript
// Union type
type Status = 'loading' | 'success' | 'error';
type Result = {success: true; data: User} | {success: false; error: string};

// Type guard
function isSuccess(result: Result): result is {success: true; data: User} {
  return result.success === true;
}

// Usage
const result: Result = await fetchUser();
if (isSuccess(result)) {
  console.log(result.data.name); // TypeScript knows data exists
} else {
  console.log(result.error); // TypeScript knows error exists
}
```
- Union: variable może być jednym z typów
- Type guard: runtime check refining type
- Discriminated unions dla complex scenarios
- typeof, instanceof jako built-in guards

---

### 14. **Jak implementujesz dark mode w React/Next.js aplikacji?**

**Odpowiedź:**
- Context dla theme state
- localStorage persistence
- CSS variables dla colors
  ```css
  :root { --bg: white; --text: black; }
  [data-theme="dark"] { --bg: black; --text: white; }
  ```
- Tailwind dark: classes
- System preference detection: prefers-color-scheme media query
- Toggle component
- Libraries: next-themes dla Next.js
- Prevent flash of wrong theme (SSR consideration)
- Smooth transitions

---

### 15. **Opisz jak działa React Keys i dlaczego są ważne.**

**Odpowiedź:**
- Unique identifier dla list items
- Pomaga React track które items changed/added/removed
- Optimization: reuse DOM elements zamiast recreate
- **Bad practice**: index as key (problemy z reordering, state bugs)
  ```typescript
  // Bad
  {items.map((item, index) => <Item key={index} {...item} />)}
  
  // Good
  {items.map((item) => <Item key={item.id} {...item} />)}
  ```
- Stable, unique, predictable keys
- Impacts performance i component state

---

### 16. **Co to jest TypeScript Utility Types? Podaj przykłady.**

**Odpowiedź:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Partial - wszystkie properties optional
type PartialUser = Partial<User>;

// Pick - wybierz specific properties
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit - exclude properties
type UserWithoutPassword = Omit<User, 'password'>;

// Required - wszystkie properties required
type RequiredUser = Required<PartialUser>;

// Record - create object type
type UserMap = Record<string, User>;

// ReturnType - extract return type z funkcji
type Response = ReturnType<typeof fetchUser>;
```
- Readonly, NonNullable, Extract, Exclude także useful
- Reduce code duplication

---

### 17. **Jak implementujesz debouncing w React search input?**

**Odpowiedź:**
```typescript
import { useState, useEffect } from 'react';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer); // cleanup
  }, [searchTerm]);
  
  useEffect(() => {
    if (debouncedTerm) {
      // API call
      fetchResults(debouncedTerm);
    }
  }, [debouncedTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}
```
- Delay API calls until user stops typing
- Libraries: lodash debounce, use-debounce hook
- Performance improvement

---

### 18. **Opisz TypeScript Enums vs Union Types. Którą opcję preferujesz?**

**Odpowiedź:**
```typescript
// Enum
enum Status {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Error = 'ERROR'
}

// Union type (preferowane)
type Status = 'PENDING' | 'SUCCESS' | 'ERROR';

// Lub const assertion
const STATUS = {
  Pending: 'PENDING',
  Success: 'SUCCESS',
  Error: 'ERROR'
} as const;
type Status = typeof STATUS[keyof typeof STATUS];
```
- Enums: generate JavaScript code, reverse mapping możliwy
- Union types: no runtime code, lighter, preferred w TypeScript community
- Const assertion: best of both worlds
- Union types: better type narrowing, tree-shaking

---

### 19. **Jak implementujesz infinite scroll w React?**

**Odpowiedź:**
```typescript
function InfiniteList() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );
    
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore]);
  
  useEffect(() => {
    fetchItems(page).then(newItems => {
      setItems(prev => [...prev, ...newItems]);
      setHasMore(newItems.length > 0);
    });
  }, [page]);
  
  return (
    <>
      {items.map(item => <Item key={item.id} {...item} />)}
      <div ref={observerRef} />
    </>
  );
}
```
- Intersection Observer API
- Libraries: react-infinite-scroll-component
- Virtualization dla performance (react-window)

---

### 20. **Jak testujesz React components? Jakie narzędzia używasz?**

**Odpowiedź:**
- **Testing Library** (React Testing Library):
  - User-centric testing
  - Query by text, role, label (not implementation details)
  ```typescript
  import { render, screen, fireEvent } from '@testing-library/react';
  
  test('button click increments counter', () => {
    render(<Counter />);
    const button = screen.getByRole('button', { name: /increment/i });
    fireEvent.click(button);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
  ```
- **Jest**: test runner, assertions, mocking
- **MSW** (Mock Service Worker): API mocking
- **Cypress/Playwright**: e2e tests
- Test types: unit, integration, e2e
- Coverage: aim for high coverage w critical paths
- Snapshot testing dla UI regression

---

## Dodatkowe Wskazówki do Rozmowy

### Przygotowanie Techniczne
- Przygotuj się na live coding - proste algorytmy, React components
- Bądź gotowy omówić trade-offs różnych rozwiązań
- Pokaż myślenie architektoniczne, nie tylko implementację
- Pytaj clarifying questions przed odpowiedzią

### Soft Skills
- Opowiadaj o projektach z perspektywy business value
- Podkreśl collaboration, code reviews, mentoring
- Mów o lessons learned z failed experiments
- Enthusiasm dla nowych technologii, ale pragmatic approach

### Pytania do Rekruterów
- Jak wygląda typowy dzień w projekcie?
- Stack technologiczny aktualnych projektów?
- Code review process?
- Możliwości rozwoju i nauki nowych technologii?
- Team structure i collaboration model?

---

**Powodzenia na rozmowie! 🚀**

*Przygotowane dla: AI REV Software Engineer Position*
