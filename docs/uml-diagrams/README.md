# The Office AI Agent - UML Architecture Diagrams

![PlantUML](https://img.shields.io/badge/PlantUML-Diagrams-blue)
![Architecture](https://img.shields.io/badge/Architecture-Enterprise%20Level-green)

Kompletna dokumentacja architektoniczna systemu **The Office AI Agent** w formie profesjonalnych diagramów UML zgodnych ze standardami światowej klasy inżynierii oprogramowania.

## 📋 Spis Treści

- [Przegląd Architektury](#przegląd-architektury)
- [Lista Diagramów](#lista-diagramów)
- [Jak Przeglądać Diagramy](#jak-przeglądać-diagramy)
- [Szczegółowy Opis Diagramów](#szczegółowy-opis-diagramów)
- [Stack Technologiczny](#stack-technologiczny)
- [Kluczowe Wzorce Projektowe](#kluczowe-wzorce-projektowe)

---

## 🏗️ Przegląd Architektury

**The Office AI Agent** to zaawansowany system automatyzacji biurowej oparty na AI, wykorzystujący:

- **Frontend**: Next.js 15 + React 19 + TypeScript 5
- **Backend**: Node.js 20 + Express 5 + TypeScript 5
- **Database**: Supabase (PostgreSQL 15)
- **AI Engine**: Google Gemini AI (gemini-2.5-flash)
- **Architektura**: Multi-tier, Service-oriented, Cloud-native

### Główne Funkcjonalności

✅ **AI Agent Chat** - Konwersacyjny interfejs z wykonywaniem narzędzi  
✅ **Email Automation** - Zarządzanie emailami z analizą AI  
✅ **PDF Generation** - Generowanie dokumentów z szablonami AI  
✅ **Web Scraping** - Scraping ręczny i oparty na AI  
✅ **Task Scheduling** - Zaplanowane zadania (cron jobs)  
✅ **Multi-user Support** - Row Level Security (RLS)

---

## 📊 Lista Diagramów

| # | Nazwa Diagramu | Plik | Typ UML | Opis |
|---|----------------|------|---------|------|
| 1 | **Component Diagram** | `01-component-diagram.puml` | Diagram Komponentów | Architektura systemu i zależności między komponentami |
| 2 | **Class Diagram** | `02-class-diagram.puml` | Diagram Klas | Struktura klas, interfejsów i relacji |
| 3 | **Sequence Diagrams** | `03-sequence-diagrams.puml` | Diagramy Sekwencji | Przepływy kluczowych operacji (5 scenariuszy) |
| 4 | **Deployment Diagram** | `04-deployment-diagram.puml` | Diagram Wdrożenia | Infrastruktura i środowisko produkcyjne |
| 5 | **Database ERD** | `05-database-erd.puml` | Entity-Relationship | Schemat bazy danych (16 tabel) |
| 6 | **Use Case Diagram** | `06-use-case-diagram.puml` | Diagram Przypadków Użycia | Funkcjonalności systemu i aktorzy (45+ use cases) |

---

## 🔍 Jak Przeglądać Diagramy

### Opcja 1: Visual Studio Code (Zalecane)

1. Zainstaluj rozszerzenie **PlantUML** od jebbs
2. Otwórz dowolny plik `.puml`
3. Naciśnij `Alt+D` aby zobaczyć podgląd na żywo
4. Eksportuj do PNG/SVG: Kliknij prawym → "Export Current Diagram"

### Opcja 2: PlantUML Online

1. Otwórz [PlantText](https://www.planttext.com/) lub [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Skopiuj zawartość pliku `.puml`
3. Wklej i kliknij "Refresh" aby zobaczyć diagram

### Opcja 3: Generowanie Lokalnie (Command Line)

```bash
# Zainstaluj PlantUML (wymaga Java)
npm install -g node-plantuml

# Wygeneruj wszystkie diagramy
cd docs/uml-diagrams
plantuml *.puml

# Wygeneruj do PNG
plantuml -tpng *.puml

# Wygeneruj do SVG (lepsza jakość)
plantuml -tsvg *.puml
```

---

## 📖 Szczegółowy Opis Diagramów

### 1️⃣ Component Diagram (Diagram Komponentów)

**Plik**: `01-component-diagram.puml`  
**Cel**: Pokazuje wysokopoziomową architekturę systemu

#### Kluczowe Elementy:

- **Frontend Layer** (Next.js)
  - React UI Components
  - Page Routes (8 głównych stron)
  - API Client (Axios)
  - Supabase Client SDK

- **Backend Layer** (Node.js + Express)
  - 12 API Route Handlers
  - 7 Core Services (Agent, AI, Email, PDF, Scraper, Cron, Inbox)
  - Middleware (Auth, Error Handler, CORS)
  - Utilities (Encryption, Validation)

- **Database Layer** (Supabase PostgreSQL)
  - 16 tabel zgrupowanych tematycznie
  - Row Level Security (RLS)
  - Real-time subscriptions

- **External Services**
  - Google Gemini AI API
  - Gmail SMTP/IMAP
  - Target Websites (scraping)

#### Co Pokazuje:
- Przepływ danych między warstwami
- Zależności komponentów
- Integracje z zewnętrznymi serwisami
- Separacja odpowiedzialności (Separation of Concerns)

---

### 2️⃣ Class Diagram (Diagram Klas)

**Plik**: `02-class-diagram.puml`  
**Cel**: Szczegółowa struktura klas i typów w systemie

#### Główne Pakiety:

1. **Type Definitions** - Definicje typów TypeScript
   - Enums: TaskType, TaskStatus, Priority
   - Interfaces: EmailConfig, PDFGenerationOptions, ScrapingConfig, AIRequest/Response

2. **Services Layer** - Klasy serwisowe
   - `AgentOrchestrator` - Centralna orkiestracja z 9 metodami
   - `AIService` - Integracja z Gemini AI (7 metod)
   - `EmailService` - Wysyłka emaili (3 metody)
   - `EmailInboxService` - Skanowanie i analiza (7 metod)
   - `PDFService` - Generowanie PDF (2 metody)
   - `ScraperService` - Web scraping (5 metod)
   - `CronService` - Zaplanowane zadania (5 metod)

3. **Utilities** - Funkcje pomocnicze
   - EncryptionUtils (AES-256)
   - InitDirectories
   - ValidateEnv

4. **Database Configuration**
   - SupabaseClient (z RLS)
   - SupabaseAdminClient (bypass RLS)

#### Relacje:
- Composition: AgentOrchestrator → wszystkie serwisy
- Association: Wszystkie serwisy → SupabaseAdminClient
- Dependency: EmailService, InboxService → EncryptionUtils

---

### 3️⃣ Sequence Diagrams (Diagramy Sekwencji)

**Plik**: `03-sequence-diagrams.puml`  
**Cel**: Pokazuje interakcje w czasie dla kluczowych operacji

#### 5 Scenariuszy:

**Scenariusz 1: AI Agent Chat z Wykonywaniem Narzędzi**
- User → Frontend → Backend → AgentOrchestrator
- Analiza intencji przez Gemini AI
- Automatyczne wykonanie akcji (np. wysyłka emaila)
- Zapis do bazy danych
- Naturalna odpowiedź AI

**Scenariusz 2: Email Inbox Scanning z Analizą AI**
- Połączenie IMAP z Gmail
- Fetch ostatnich 10 emaili
- Dla każdego: parsowanie → analiza AI → zapis
- Generowanie draft response jeśli potrzebne
- Aktualizacja logów

**Scenariusz 3: PDF Generation z AI**
- User wybiera kategoriię (np. "Faktura VAT")
- Pobieranie kontekstu użytkownika
- Generowanie treści przez AI
- Tworzenie PDF z PDFKit
- Zapis do file system + database

**Scenariusz 4: Web Scraping z AI Extraction**
- HTTP GET do target website
- Parsowanie HTML (Cheerio)
- Ekstrakcja tekstu
- AI analizuje i ekstrahuje dane
- Zapis wyniku do bazy

**Scenariusz 5: Scheduled Task (Cron Job)**
- User tworzy cron job
- Walidacja cron expression
- Rejestracja w node-cron
- Automatyczne wykonanie o czasie
- Aktualizacja statusu

---

### 4️⃣ Deployment Diagram (Diagram Wdrożenia)

**Plik**: `04-deployment-diagram.puml`  
**Cel**: Pokazuje infrastrukturę produkcyjną

#### Węzły Deploymentu:

1. **Client Devices**
   - Web Browser (Chrome, Firefox, Safari)
   - Mobile Browser (iOS, Android)

2. **Frontend Server** (Vercel / VPS)
   - Next.js 15 Application
   - React 19 UI
   - Static Assets (CSS, JS, Images)
   - Port: HTTPS :443

3. **Backend Server** (VPS / Cloud VM)
   - Node.js 20 Runtime
   - Express Server (Port :3001)
   - Services Layer
   - File Storage (uploads/pdfs, uploads/attachments)

4. **Database Server** (Supabase Cloud)
   - PostgreSQL 15
   - Auth Service (JWT)
   - Storage Service (Buckets)
   - Realtime Service (WebSocket)

5. **External Services**
   - Google Gemini AI (HTTPS)
   - Gmail SMTP :587 / IMAP :993
   - Target Websites (HTTPS)

6. **Monitoring** (Optional)
   - Application Logs
   - Error Tracking (Sentry)
   - Performance Monitoring

#### Deployment Options:
- **Frontend**: Vercel (zalecane), Netlify, AWS Amplify, Custom VPS
- **Backend**: DigitalOcean, AWS EC2, GCP, Heroku, Railway
- **Process Manager**: PM2, systemd, Docker
- **Reverse Proxy**: Nginx, Apache

---

### 5️⃣ Database ERD (Entity-Relationship Diagram)

**Plik**: `05-database-erd.puml`  
**Cel**: Kompletny schemat bazy danych

#### 16 Głównych Tabel:

**User Management:**
- `auth.users` (Supabase built-in)
- `user_profiles` - Profile użytkowników z kontekstem AI
- `notifications` - Powiadomienia systemowe

**Email System:**
- `user_imap_configs` - Konfiguracje IMAP/SMTP (zaszyfrowane hasła)
- `emails_inbox` - Odebrane emaile z analizą AI
- `ai_email_drafts` - Draft responses wygenerowane przez AI
- `emails_sent` - Historia wysłanych emaili
- `email_templates` - Szablony wiadomości
- `email_scan_logs` - Logi skanowania skrzynki

**Document System:**
- `pdf_templates` - Szablony dokumentów PDF
- `pdf_files` - Wygenerowane pliki PDF

**Automation:**
- `scrape_jobs` - Zadania scrapingowe (ręczne + AI)
- `scrape_history` - Historia wykonań scrapingu
- `cron_jobs` - Zaplanowane zadania

**AI & Chat:**
- `chat_messages` - Historia konwersacji z AI

#### Kluczowe Funkcje:
- **Row Level Security (RLS)** - Każdy użytkownik widzi tylko swoje dane
- **Encryption** - Hasła IMAP/SMTP zaszyfrowane AES-256
- **JSONB Fields** - Elastyczne przechowywanie konfiguracji
- **Indexes** - Zoptymalizowane zapytania
- **Foreign Keys** - Integralność referencyjna
- **Timestamps** - Automatyczne created_at/updated_at

---

### 6️⃣ Use Case Diagram (Diagram Przypadków Użycia)

**Plik**: `06-use-case-diagram.puml`  
**Cel**: Pokazuje wszystkie funkcjonalności systemu z perspektywy użytkownika

#### Aktorzy:

1. **Office Worker (User)** - Główny użytkownik systemu
2. **Administrator** - Zarządzanie systemem
3. **System Scheduler** - Automatyczne wykonywanie zadań
4. **Gemini AI** - Zewnętrzny serwis AI
5. **Gmail SMTP/IMAP** - Integracja emailowa
6. **External Websites** - Strony do scrapowania

#### 7 Głównych Pakietów Use Cases:

**1. Authentication & User Management** (5 use cases)
- Register Account
- Login
- Manage Profile
- Configure User Context
- Set Preferences

**2. AI Agent Chat** (5 use cases)
- Chat with AI Agent
- Execute Natural Language Commands
- Analyze User Intent
- Execute Tools
- View Chat History

**3. Email Automation** (10 use cases)
- Configure IMAP/SMTP
- Send Email
- Scan Inbox
- AI Email Analysis
- Generate Email Draft
- Approve and Send Draft
- Manage Email Templates
- Generate Template with AI
- View Sent Emails
- Search Emails

**4. PDF Document Generation** (5 use cases)
- Create PDF Template
- Generate PDF with AI
- Generate PDF from Template
- Download PDF
- View PDF History

**5. Web Scraping & Monitoring** (8 use cases)
- Create Scrape Job
- Manual Selector Scraping
- AI-Powered Scraping
- Analyze Page Structure
- Schedule Scraping
- Monitor Changes
- Set Alerts
- View Scrape History

**6. Task Automation (Cron Jobs)** (7 use cases)
- Create Cron Job
- Schedule Email Task
- Schedule PDF Task
- Schedule Scraping Task
- Enable/Disable Job
- View Job History
- Execute Scheduled Task

**7. Dashboard & Analytics** (4 use cases)
- View Dashboard
- View Statistics
- View Notifications
- Search All Data

#### Relacje:
- **<<include>>** - Zawsze wykonywane (np. Intent Analysis → Tool Execution)
- **<<extend>>** - Opcjonalnie (np. Email Analysis → Draft Generation)

---

## 🛠️ Stack Technologiczny

### Frontend
```
Next.js 15          - React Framework z Server Components
React 19            - UI Library
TypeScript 5        - Type Safety
Tailwind CSS 4      - Utility-first CSS
Axios               - HTTP Client
Lucide React        - Icon Library
Recharts            - Data Visualization
```

### Backend
```
Node.js 20          - JavaScript Runtime
Express 5           - Web Framework
TypeScript 5        - Type Safety
Nodemailer          - SMTP Email Sending
IMAP                - Email Inbox Fetching
Mailparser          - Email Parsing
PDFKit              - PDF Generation
Cheerio             - HTML Parsing (Web Scraping)
node-cron           - Task Scheduling
Axios               - HTTP Client
```

### Database & Services
```
Supabase            - Backend-as-a-Service
PostgreSQL 15       - Relational Database
Row Level Security  - Multi-tenant Security
Google Gemini AI    - AI Model (gemini-2.5-flash)
Gmail SMTP/IMAP     - Email Integration
```

### DevOps & Tools
```
npm/yarn            - Package Manager
PM2                 - Process Manager
Nginx               - Reverse Proxy
Git                 - Version Control
PlantUML            - UML Diagrams
```

---

## 🎯 Kluczowe Wzorce Projektowe

### 1. **Layered Architecture (Architektura Warstwowa)**
```
Presentation Layer (Frontend)
    ↓
Application Layer (API Routes)
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (Supabase Client)
    ↓
Database (PostgreSQL)
```

### 2. **Service Layer Pattern**
Każda funkcjonalność ma dedykowany serwis:
- `AIService` - Komunikacja z AI
- `EmailService` - Wysyłka emaili
- `PDFService` - Generowanie PDF
- `ScraperService` - Web scraping
- `CronService` - Zaplanowane zadania

### 3. **Repository Pattern**
Abstrakcja dostępu do danych przez Supabase Client:
```typescript
// Każdy serwis używa:
supabase.from('table_name').select('*').eq('user_id', userId)
```

### 4. **Middleware Pattern**
Express middleware dla cross-cutting concerns:
- Authentication Middleware (JWT verification)
- Error Handler Middleware (centralized error handling)
- CORS Middleware (security)

### 5. **Orchestrator Pattern**
`AgentOrchestrator` koordynuje wszystkie serwisy:
```typescript
analyzeIntent() → executeAction() → [EmailService | PDFService | ScraperService | CronService]
```

### 6. **Strategy Pattern**
Dynamiczny wybór narzędzia na podstawie intencji użytkownika:
```typescript
switch(action.tool) {
  case 'send_email': executeSendEmail();
  case 'generate_pdf': executeGeneratePDF();
  case 'scrape_website': executeScrapeWebsite();
  // ...
}
```

### 7. **Template Method Pattern**
Email templates z placeholderami:
```typescript
"Hello {{name}}, your invoice {{invoice_id}} is ready."
```

### 8. **Observer Pattern**
Supabase Realtime subscriptions:
```typescript
supabase.from('notifications')
  .on('INSERT', callback)
  .subscribe()
```

### 9. **Singleton Pattern**
Wszystkie serwisy eksportowane jako single instance:
```typescript
export default new AIService();
```

### 10. **Factory Pattern**
Tworzenie konfiguracji na podstawie typu:
```typescript
createTransporter(config: EmailConfig): Transporter
```

---

## 📈 Wskaźniki Jakości Architektury

### ✅ Separation of Concerns
- Frontend oddzielony od Backendu
- Services oddzielone od Routes
- Business logic oddzielona od data access

### ✅ Single Responsibility Principle
- Każdy serwis ma jedną odpowiedzialność
- Każda tabela przechowuje jeden typ danych
- Każdy komponent ma jedno zadanie

### ✅ DRY (Don't Repeat Yourself)
- Utilities dla wspólnej funkcjonalności
- Type definitions współdzielone
- Middleware reużywalne

### ✅ Security First
- JWT Authentication
- AES-256 Encryption dla haseł
- Row Level Security (RLS)
- CORS configuration
- Environment variables

### ✅ Scalability
- Stateless backend (można skalować horyzontalnie)
- Database connection pooling
- Możliwość dodania Redis cache
- Możliwość dodania load balancera

### ✅ Maintainability
- TypeScript dla type safety
- Clear naming conventions
- Comprehensive documentation
- Modular architecture

---

## 🎓 Jak Czytać Te Diagramy

### 1. Zacznij od Component Diagram
Zrozum ogólną architekturę systemu.

### 2. Przejdź do Use Case Diagram
Zobacz wszystkie funkcjonalności z perspektywy użytkownika.

### 3. Studiuj Class Diagram
Zrozum strukturę kodu i klasy.

### 4. Analizuj Sequence Diagrams
Zobacz jak system działa w czasie rzeczywistym.

### 5. Sprawdź Database ERD
Zrozum model danych.

### 6. Na końcu Deployment Diagram
Zobacz jak system jest wdrażany w produkcji.

---

## 📚 Dodatkowe Zasoby

### Dokumentacja Projektu
- `README.md` - Główna dokumentacja
- `IMPLEMENTATION_GUIDE.md` - Przewodnik implementacji
- `SUPABASE_SETUP.md` - Konfiguracja bazy danych
- `USER_GUIDE.md` - Instrukcja dla użytkowników

### PlantUML Resources
- [PlantUML Official Docs](https://plantuml.com/)
- [PlantUML Component Diagram](https://plantuml.com/component-diagram)
- [PlantUML Class Diagram](https://plantuml.com/class-diagram)
- [PlantUML Sequence Diagram](https://plantuml.com/sequence-diagram)

### UML Standards
- [UML 2.5 Specification](https://www.omg.org/spec/UML/2.5/)
- [C4 Model](https://c4model.com/) - Modern approach to software architecture diagrams

---

## 👨‍💻 Autor

**The Office AI Agent Team**  
Senior Software Engineers & AI Specialists

---

## 📄 Licencja

ISC License

---

## 🔄 Historia Zmian

### v1.0.0 (2024-11-30)
- ✅ Utworzono 6 kompleksowych diagramów UML
- ✅ Dodano szczegółową dokumentację
- ✅ Analiza całego repozytorium
- ✅ Enterprise-level quality diagrams

---

**Uwaga**: Te diagramy są żywymi dokumentami. Aktualizuj je wraz ze zmianami w kodzie!

