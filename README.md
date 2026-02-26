# Office AI Agent 🤖

**Nowoczesny system AI do automatyzacji pracy biurowej** - inteligentny agent który zastępuje zwykłego pracownika biurowego, automatyzując zadania takie jak wysyłanie emaili, generowanie PDF-ów, web scraping i wiele więcej.
.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat&logo=node.js)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat&logo=tailwind-css)

## 📋 Spis treści

- [Funkcjonalności](#-funkcjonalności)
- [Technologie](#-technologie)
- [**📊 Dokumentacja Architektury (UML Diagrams)**](#-dokumentacja-architektury)
- [Struktura projektu](#-struktura-projektu)
- [Instalacja](#-instalacja)
- [Konfiguracja](#-konfiguracja)
- [Uruchomienie](#-uruchomienie)
- [Dokumentacja API](#-dokumentacja-api)
- [Screenshots](#-screenshots)

## 📊 Dokumentacja Architektury

### 🎨 Profesjonalne Diagramy UML

Projekt zawiera **kompletną dokumentację architektoniczną** na poziomie enterprise w formie diagramów UML:

📂 **Lokalizacja**: [`docs/uml-diagrams/`](docs/uml-diagrams/)

#### 6 Diagramów Świadczących o Jakości Architektury:

1. **Component Diagram** - Architektura systemu i zależności komponentów
2. **Class Diagram** - Struktura klas, serwisów i relacji
3. **Sequence Diagrams** - 5 szczegółowych przepływów operacji
4. **Deployment Diagram** - Infrastruktura i strategia wdrożenia
5. **Database ERD** - Schemat bazy danych (16 tabel)
6. **Use Case Diagram** - Wszystkie funkcjonalności systemu (45+ use cases)

#### 📖 Dokumentacja:
- **[Pełna Dokumentacja](docs/uml-diagrams/README.md)** - Szczegółowy przewodnik po wszystkich diagramach (4500+ słów)
- **[Quick Start](docs/uml-diagrams/QUICKSTART.md)** - Jak szybko zobaczyć diagramy (1 minuta)
- **[Przewodnik Generowania](docs/uml-diagrams/GENERATE_IMAGES.md)** - Jak wygenerować PNG/SVG/PDF
- **[Podsumowanie Implementacji](docs/uml-diagrams/IMPLEMENTATION_SUMMARY.md)** - Co zostało zrobione

#### ⚡ Quick Preview:
```bash
# Otwórz w VS Code z rozszerzeniem PlantUML
code docs/uml-diagrams/01-component-diagram.puml
# Naciśnij Alt+D aby zobaczyć diagram
```

**Poziom Jakości**: ⭐⭐⭐⭐⭐ World-Class Enterprise Architecture

## ✨ Funkcjonalności

### 🤖 AI Agent Chat
- Konwersacyjny interfejs z AI
- Przetwarzanie zadań w języku naturalnym
- Context-aware responses
- Historia interakcji

### 📧 Email Automation
- Automatyczne wysyłanie emaili
- Szablony wiadomości
- Zaplanowane wysyłki
- Obsługa załączników
- Bulk email support

### 📄 PDF Generator
- Generowanie dokumentów PDF
- Gotowe szablony (faktury, oferty, raporty)
- AI-assisted content generation
- Customizable layouts

### 🌐 Web Scraper
- Automatyczne zbieranie danych ze stron
- Selektory CSS
- Scheduled scraping
- Data export (CSV, JSON)
- AI-powered data processing

### ⏰ Scheduled Tasks (Cron)
- Zadania cykliczne
- Flexible cron expressions
- Task monitoring
- Automatic retries
- Email notifications

### 📊 Dashboard
- Real-time statistics
- Task overview
- Performance metrics
- Activity logs

## 🛠 Technologie

```
the-office-Agent-ai/
├── backend/           # Serwer API Node.js + TypeScript
│   ├── src/
│   │   ├── config/    # Konfiguracja (Supabase, etc.)
│   │   ├── controllers/
│   │   ├── services/  # Logika biznesowa (PDF, Email, Scraping, AI, Cron)
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   └── package.json
│
└── frontend/          # Aplikacja Next.js + React + Tailwind CSS
    ├── app/
    ├── components/
    ├── lib/           # API client, Supabase client
    ├── types/
    └── package.json
```

## Technologie

### Backend
- **Node.js** + **TypeScript**
- **Express** - Framework webowy
- **Supabase** - Baza danych i autentykacja
- **PDFKit** - Generowanie PDF
- **Cheerio** - Web scraping
- **Nodemailer** - Wysyłanie emaili
- **node-cron** - Zaplanowane zadania
- **Axios** - Komunikacja z AI API

### Frontend
- **Next.js 15** + **React**
- **TypeScript**
- **Tailwind CSS** - Stylowanie
- **Supabase Client** - Połączenie z bazą danych
- **Axios** - Komunikacja z API

## Instalacja

### Backend

```bash
cd backend
npm install
```

Skopiuj plik `.env.example` do `.env` i uzupełnij zmienne środowiskowe:

```bash
cp .env.example .env
```

### Frontend

```bash
cd frontend
npm install
```

Skopiuj plik `.env.local.example` do `.env.local` i uzupełnij zmienne środowiskowe:

```bash
cp .env.local.example .env.local
```

## Uruchomienie

### Backend (Development)

```bash
cd backend
npm run dev
```

Serwer uruchomi się na `http://localhost:3001`

### Frontend (Development)

```bash
cd frontend
npm run dev
```

Aplikacja uruchomi się na `http://localhost:3000`

### Backend (Production)

```bash
cd backend
npm run build
npm start
```

## Dostępne Serwisy

### 1. **AI Service** (`aiService.ts`)
- Komunikacja z zewnętrznym API AI
- Przetwarzanie zadań przez AI
- Analiza tekstu

### 2. **PDF Service** (`pdfService.ts`)
- Generowanie dokumentów PDF
- Tworzenie strukturyzowanych raportów

### 3. **Email Service** (`emailService.ts`)
- Wysyłanie pojedynczych emaili
- Wysyłanie masowych emaili
- Obsługa załączników

### 4. **Scraper Service** (`scraperService.ts`)
- Scraping stron internetowych
- Ekstrakcja danych z HTML
- Obsługa wielu stron jednocześnie

### 5. **Cron Service** (`cronService.ts`)
- Planowanie zadań cyklicznych
- Zarządzanie harmonogramem
- Automatyzacja procesów

## Konfiguracja Zmiennych Środowiskowych

### Backend

```env
NODE_ENV=development
PORT=3001

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

AI_API_KEY=your_ai_api_key
AI_API_URL=https://api.openai.com/v1/chat/completions

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Następne Kroki

1. **Skonfiguruj Supabase**
   - Utwórz projekt na [supabase.com](https://supabase.com)
   - Skopiuj URL i klucze do plików `.env`

2. **Skonfiguruj AI API**
   - Wybierz dostawcę (OpenAI, Anthropic, etc.)
   - Uzyskaj klucz API
   - Zaktualizuj `AI_API_URL` i `AI_API_KEY`

3. **Skonfiguruj Email**
   - Dla Gmail: włącz 2FA i wygeneruj hasło aplikacji
   - Zaktualizuj dane w `.env`

4. **Rozpocznij Rozwój**
   - Dodaj endpoints w `routes/`
   - Implementuj logikę w `controllers/`
   - Twórz komponenty UI w `frontend/components/`

## Skrypty NPM

### Backend
- `npm run dev` - Uruchom serwer deweloperski z hot-reload
- `npm run build` - Zbuduj projekt do produkcji
- `npm start` - Uruchom zbudowaną aplikację
- `npm run lint` - Sprawdź kod ESLint
- `npm run format` - Formatuj kod Prettier

### Frontend
- `npm run dev` - Uruchom aplikację deweloperską
- `npm run build` - Zbuduj aplikację do produkcji
- `npm start` - Uruchom zbudowaną aplikację
- `npm run lint` - Sprawdź kod ESLint

## Licencja

ISC

## Autor

AI Office Agent Team
