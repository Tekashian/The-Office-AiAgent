# Przygotowanie do Rozmowy Technicznej - AI REV Software Engineer

## Spis Treści
1. [Pytania Ogólno-Techniczne (20)](#pytania-ogólno-techniczne)
2. [Pytania Dotyczące Projektu The-Office-Agent-AI (20)](#pytania-dotyczące-projektu)
3. [Pytania React & TypeScript (20)](#pytania-react--typescript)

---

## Pytania Ogólno-Techniczne

### 1. **Wyjaśnij różnicę między procesem a wątkiem. Jak zarządzasz współbieżnością w aplikacjach?**

**Odpowiedź:**
- Proces to niezależna jednostka wykonawcza z własną przestrzenią pamięci
- Wątek to lżejsza jednostka wykonawcza dzieląca pamięć z innymi wątkami w procesie
- Zarządzanie współbieżnością: goroutines w Go, async/await w Python/JS, muteksy, semafory, channels
- W projektach stosuję pattern producer-consumer, worker pools, oraz message queues (RabbitMQ, Kafka)

---

### 2. **Co to jest CAP theorem i jak wpływa na projektowanie systemów rozproszonych?**

**Odpowiedź:**
- CAP: Consistency, Availability, Partition Tolerance - można wybrać maksymalnie 2 z 3
- W praktyce partition tolerance jest konieczna, więc wybieramy między CP (consistency) lub AP (availability)
- Przykłady: PostgreSQL (CP), Cassandra (AP), eventual consistency w systemach rozproszonych
- W projektach balansuję między silną spójnością a dostępnością w zależności od wymagań biznesowych

---

### 3. **Jak działa garbage collection i jakie ma wpływ na wydajność aplikacji?**

**Odpowiedź:**
- GC automatycznie zarządza pamięcią, usuwając nieużywane obiekty
- Go: concurrent mark-and-sweep, Python: reference counting + cycle detector
- Wpływ: pauzy GC (stop-the-world), zwiększone użycie CPU, latency spikes
- Optymalizacja: object pooling, zmniejszenie alokacji, tuning parametrów GC, profiling (pprof w Go)

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
- Docker: konteneryzacja na poziomie OS, dzielenie kernela
- VM: pełna wirtualizacja z własnym OS
- Kontenery: lżejsze, szybszy start, mniejsze zużycie zasobów
- Docker: image layers, Dockerfile, registry (Docker Hub)
- Izolacja: namespaces, cgroups
- Kubernetes do orkiestracji kontenerów w production
- Multi-stage builds dla optymalizacji rozmiaru image

---

### 13. **Jak implementujesz CI/CD pipeline? Jakie są best practices?**

**Odpowiedź:**
- Stages: Build → Test → Deploy
- Automated testing: unit, integration, e2e
- Static analysis, linting, security scanning
- Artifact management, version tagging
- Blue-green deployment, canary releases, rollback strategy
- Infrastructure as Code (Terraform, CloudFormation)
- Narzędzia: GitHub Actions, GitLab CI, Jenkins, CircleCI
- Secrets management, environment-specific configs

---

### 14. **Opisz wzorzec Repository i dlaczego jest użyteczny.**

**Odpowiedź:**
- Abstrakcja dostępu do danych od logiki biznesowej
- Interface definiujący operacje CRUD
- Zalety: testability (mock repository), separation of concerns, łatwa zmiana DB
- Struktura: Repository Interface → Implementation → Service Layer
- W Go często używam z dependency injection
- Unit of Work pattern dla transakcji

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
- Backend (Node.js/TypeScript): REST API, orchestrator agentów
- Frontend (Next.js/React): UI, dashboard, formularz
- Supabase: PostgreSQL database, authentication, storage
- Główne moduły:
  - Agent Orchestrator: zarządzanie agentami AI
  - Email Service: IMAP inbox, templates, wysyłanie
  - Scraper Service: web scraping, data extraction
  - PDF Service: generowanie dokumentów
  - Task Management: cron jobs, notifications
  - User Context: personalizacja, preferencje

---

### 2. **Jak zaimplementowałeś autentykację w projekcie? Jakie mechanizmy bezpieczeństwa stosowałeś?**

**Odpowiedź:**
- Supabase Auth: JWT tokens, session management
- Middleware auth.ts: weryfikacja tokenów, route protection
- Row Level Security (RLS) w Supabase dla data isolation
- HTTPS only, secure cookies
- Password hashing (bcrypt), email verification
- Rate limiting na endpoint'ach auth
- CORS configuration
- Input validation, sanitization przeciw injection attacks

---

### 3. **Wyjaśnij jak działa Agent Orchestrator w tym projekcie.**

**Odpowiedź:**
- Centralny komponent zarządzający multiple AI agents
- Orchestration logic: routing zapytań do odpowiednich agentów
- State management: tracking konwersacji, kontekst
- Integration z LLM APIs (OpenAI, Anthropic)
- Prompt engineering: system prompts, context injection
- Error handling, retry logic dla API calls
- Logging conversations dla audytu
- Możliwość równoległego przetwarzania requestów
- Monitoring: latency, token usage, error rates

---

### 4. **Jak zaprojektowałeś strukturę bazy danych? Opisz główne tabele i relacje.**

**Odpowiedź:**
- Users: authentication, profiles
- Email_inbox: IMAP messages, attachments
- Email_templates: reusable templates z placeholders
- Email_configs: IMAP/SMTP settings per user
- Tasks: scheduled jobs, cron definitions
- Notifications: user alerts, in-app notifications
- PDF_templates: document templates
- Scraper_data: scraped content, metadata
- User_context: preferences, settings
- Relacje: Foreign keys, CASCADE deletes, indexes na frequently queried columns
- RLS policies dla multi-tenancy

---

### 5. **Jak implementujesz Email Inbox z IMAP? Jakie wyzwania napotkałeś?**

**Odpowiedź:**
- node-imap library dla connection
- Polling strategy vs IDLE command dla real-time
- Authentication: OAuth2 dla Gmail, app passwords dla innych
- Parsing email structure: multipart messages, attachments
- Wyzwania:
  - Connection stability, reconnection logic
  - Memory management dla dużych attachments
  - Rate limiting różnych providerów (Gmail, Outlook)
  - Character encoding issues
  - Spam detection, phishing protection
- Storage: attachments w Supabase Storage
- Background jobs dla periodic sync

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
- PDF library: pdfkit lub puppeteer (HTML to PDF)
- Template approach: HTML + CSS → PDF rendering
- Dynamic data injection: podobnie jak email templates
- Support dla: images, tables, custom fonts, headers/footers
- Storage: Supabase Storage z signed URLs
- Generation queue dla async processing
- Preview przed finalizacją
- Metadata: author, creation date, permissions
- Optimization: compression, file size limits
- Security: access control, expiration links

---

### 9. **Jak zarządzasz scheduled tasks (cron jobs) w aplikacji?**

**Odpowiedź:**
- Node-cron lub agenda dla job scheduling
- Endpoint API trigger dla external cron services (cron-job.org)
- Task definitions stored w database
- Types: email sync, scraper runs, notifications cleanup
- Execution tracking: last run, next run, status
- Error handling, retry policy
- Logging wszystkich executions
- Monitoring: failed jobs alerts
- Scalability: distributed locks dla multiple instances
- Admin panel do zarządzania tasks

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
- Error middleware w Express: centralized error handling
- Custom error classes: ValidationError, AuthenticationError, NotFoundError
- HTTP status codes: proper use of 4xx, 5xx
- Error responses: consistent JSON structure {error, message, details}
- Logging: Winston/Pino dla structured logs
- Nie expose'owanie sensitive info w error messages
- Try-catch blocks w async functions
- Frontend: error boundaries w React, user-friendly messages
- Monitoring: Sentry/error tracking service integration
- Graceful degradation gdzie możliwe

---

### 12. **Jak zaimplementowałeś User Context? Co przechowujesz o użytkowniku?**

**Odpowiedź:**
- User preferences: language, timezone, notification settings
- Application state: ostatnio używane features, favorites
- Personalization data dla AI agents
- Activity tracking: last login, usage statistics
- Settings persistence w Supabase
- Context injection do AI prompts dla personalized responses
- Privacy: GDPR compliance, data minimization
- Encrypted sensitive data
- User export/delete functionality
- Migration system dla schema changes

---

### 13. **Jak zapewniasz skalowalność backendu? Jakie pattern'y zastosowałeś?**

**Odpowiedź:**
- Stateless API: horizontal scaling możliwe
- Connection pooling dla database
- Caching z Redis dla expensive operations
- Async processing: queue jobs dla long-running tasks
- Rate limiting per user
- Database indexes, query optimization
- CDN dla static assets
- Load balancing ready (brak session storage w memory)
- Monitoring resource usage
- Graceful shutdown handling
- Environment-based configuration

---

### 14. **Opisz strukturę routes w backendzie. Jak organizujesz endpoints?**

**Odpowiedź:**
- RESTful convention: /api/resource
- Grouped by domain:
  - /api/agent - AI agent interactions
  - /api/email - email operations (send, templates)
  - /api/email-inbox - inbox management
  - /api/scraper - scraping jobs
  - /api/pdf - PDF generation
  - /api/tasks - cron task management
  - /api/notifications - notification CRUD
  - /api/user-context - user settings
- Versioning consideration: /api/v1
- Auth middleware applied per route group
- Input validation middleware
- Rate limiting per endpoint

---

### 15. **Jak testujesz integrację z external services (Supabase, Email providers, AI APIs)?**

**Odpowiedź:**
- Mocking w unit tests: jest.mock(), sinon
- Integration tests z test database (Supabase local)
- Sandbox accounts dla external APIs
- Contract testing dla API integrations
- Test fixtures, sample data
- Environment variables dla test configs
- Timeout handling, error simulation
- Rate limit testing
- End-to-end tests dla critical flows
- Manual testing w staging environment
- Monitoring test coverage

---

### 16. **Jak zaprojektowałeś frontend architecture? Opisz folder structure.**

**Odpowiedź:**
- Next.js App Router: app/ directory structure
- Route-based organization:
  - app/agent - AI chat interface
  - app/email - email management
  - app/email-inbox - inbox view
  - app/tasks - task dashboard
  - app/notifications - notification center
  - app/settings - user settings
- components/: reusable UI components
  - layout/ - navigation, sidebar
  - ui/ - buttons, forms, modals (shadcn/ui)
- lib/: utilities, API client, auth helpers
- types/: TypeScript interfaces
- context/: React Context dla global state
- Separation of concerns, component reusability

---

### 17. **Jak implementujesz real-time features w aplikacji?**

**Odpowiedź:**
- Supabase Realtime: PostgreSQL Change Data Capture
- Subscriptions do specific tables
- WebSocket connection management
- Automatic reconnection handling
- React hooks dla real-time data (useEffect + cleanup)
- Optimistic updates w UI
- Conflict resolution strategy
- Notifications provider: NotificationProvider.tsx
- Real-time inbox updates
- Presence tracking możliwość (who's online)
- Performance: selective subscriptions, filtering

---

### 18. **Jak zarządzasz state w React aplikacji?**

**Odpowiedź:**
- React Context dla global state (auth, notifications)
- Local state z useState dla component-specific
- Custom hooks dla reusable logic
- Server state z React Query/SWR potential
- Form state: controlled components, validation
- PDF refresh context: pdfRefreshContext.tsx
- Prop drilling minimization
- State colocation principle
- Immutable updates pattern
- Performance optimization: useMemo, useCallback
- Nie używam Redux (overkill dla tego projektu)

---

### 19. **Opisz proces deployment. Jak wdrażasz zmiany na production?**

**Odpowiedź:**
- Git workflow: feature branches → PR → merge to master
- CI/CD z GitHub Actions potential
- Backend deployment: Node.js hosting (Heroku, Railway, VPS)
- Frontend deployment: Vercel (Next.js native)
- Environment variables management
- Database migrations z Supabase CLI
- Staging environment dla testów
- Blue-green deployment strategy
- Rollback plan
- Health checks, smoke tests post-deployment
- Monitoring logs, error rates after deploy
- Zero-downtime deployment goal

---

### 20. **Jakie usprawnienia/features chciałbyś dodać do projektu w przyszłości?**

**Odpowiedź:**
- WebSocket real-time dla agent chat (zamiast polling)
- Webhook support dla external integrations
- Multi-language support (i18n)
- Advanced analytics dashboard
- AI model fine-tuning na custom data
- Mobile app (React Native)
- Collaboration features (shared workspaces)
- Advanced scheduling (recurring tasks patterns)
- Integration z więcej AI providers (Anthropic, Cohere)
- Performance monitoring dashboard
- Automated testing suite expansion
- Docker containerization całego stacku
- Kubernetes deployment dla skalowalności

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
- Superset JavaScript z static typing
- Zalety:
  - Catch errors at compile time zamiast runtime
  - Better IDE support: autocomplete, refactoring
  - Self-documenting code
  - Easier refactoring w dużych projektach
  - Interface contracts między modułami
- Type inference, generics, union types, type guards
- Strict mode dla maximum safety
- Gradual adoption możliwa (any type)
- Compilation do JavaScript

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
- File-based routing w app/ directory
- Folders define routes: app/dashboard/page.tsx → /dashboard
- Dynamic routes: app/users/[id]/page.tsx → /users/123
- Route groups: (auth) nie wpływa na URL
- Layouts: shared UI, nested layouts
- Loading states: loading.tsx
- Error handling: error.tsx
- Metadata API dla SEO
- Navigation: Link component, useRouter hook, redirect
- Server Components by default, 'use client' dla interactivity

---

### 11. **Wyjaśnij różnicę między Server Components a Client Components w Next.js.**

**Odpowiedź:**
- **Server Components** (default):
  - Render on server, nie wysyłane do klienta
  - Direct database access, no bundle size impact
  - Nie mogą używać hooks, event handlers
  - Better performance, SEO
- **Client Components** ('use client'):
  - Interactive, useState, useEffect, event handlers
  - Render on client, part of JS bundle
  - Browser APIs access
- Strategy: server components gdy możliwe, client dla interactivity
- Composition: server components w client components works

---

### 12. **Jak obsługujesz API calls w React? Opisz best practices.**

**Odpowiedź:**
```typescript
const [data, setData] = useState<User[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const controller = new AbortController();
  
  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        signal: controller.signal
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }
  
  fetchData();
  return () => controller.abort(); // cleanup
}, []);
```
- Loading, error, data states
- AbortController dla cleanup
- Libraries: React Query (tanstack/query), SWR
- Centralized API client (lib/api.ts)

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
