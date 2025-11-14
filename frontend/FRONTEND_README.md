# Office AI Agent - Frontend

Nowoczesny interfejs użytkownika dla systemu AI Agent do automatyzacji pracy biurowej.

## 🎨 Technologie

- **Next.js 15** - React framework z App Router
- **TypeScript** - Typowanie statyczne
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Nowoczesne ikony
- **Recharts** - Wykresy i wizualizacje
- **Supabase Client** - Integracja z bazą danych

## 📁 Struktura Projektu

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard (/)
│   ├── agent/             # AI Agent Chat
│   ├── email/             # Email Automation
│   ├── pdf/               # PDF Generator
│   ├── scraper/           # Web Scraper
│   ├── tasks/             # Scheduled Tasks
│   ├── settings/          # Ustawienia
│   ├── layout.tsx         # Root layout z Sidebar
│   └── globals.css        # Style globalne
├── components/
│   ├── ui/                # Komponenty UI (Button, Card, etc.)
│   ├── layout/            # Layout components (Sidebar, Header)
│   └── NotificationProvider.tsx
├── lib/
│   ├── api.ts            # Axios API client
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
└── types/
    └── index.ts          # TypeScript types

```

## 🚀 Funkcjonalności

### Dashboard
- Statystyki w czasie rzeczywistym
- Lista ostatnich zadań
- Quick actions
- Wykresy i wizualizacje

### AI Agent Chat
- Interfejs konwersacyjny z AI
- Wysyłanie zadań do agenta
- Historia rozmów
- Real-time responses

### Email Automation
- Kompozycja nowych emaili
- Szablony wiadomości
- Zaplanowane wysyłki
- Historia wysłanych emaili

### PDF Generator
- Tworzenie dokumentów PDF
- Gotowe szablony (faktury, raporty, oferty)
- AI-assisted content generation
- Podgląd i download

### Web Scraper
- Konfiguracja zadań scrapowania
- Selektory CSS
- Harmonogram automatyczny
- Eksport danych (CSV, JSON)

### Scheduled Tasks (Cron)
- Zarządzanie zadaniami cyklicznymi
- Wyrażenia cron
- Monitoring wykonań
- Statystyki

### Ustawienia
- Profil użytkownika
- Konfiguracja API keys
- Preferencje powiadomień
- Zarządzanie danymi

## 🎨 Design System

### Kolory
- **Primary**: Blue (#0ea5e9)
- **Success**: Green
- **Warning**: Yellow
- **Danger**: Red
- **Info**: Blue

### Komponenty UI

#### Button
```tsx
<Button variant="primary" size="md">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Badge
```tsx
<Badge variant="success">Ukończone</Badge>
<Badge variant="warning">Oczekuje</Badge>
```

#### Input & Textarea
```tsx
<Input label="Email" placeholder="email@example.com" />
<Textarea label="Message" rows={5} />
```

### Dark Mode
Aplikacja wspiera dark mode - przełącznik w sidebar.

## 🔧 Rozwój

### Uruchomienie

```bash
npm run dev
```

Aplikacja uruchomi się na `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📱 Responsywność

Aplikacja jest w pełni responsywna:
- **Desktop**: Sidebar po lewej, pełen layout
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu, mobilna nawigacja

## 🔗 Integracja z Backend

API client skonfigurowany w `lib/api.ts`:

```typescript
import apiClient from '@/lib/api';

// Przykład użycia
const response = await apiClient.post('/api/tasks', {
  type: 'email',
  description: '...',
});
```

## 🎯 Następne kroki

1. Podłączyć prawdziwe API endpoints z backendu
2. Dodać autentykację użytkowników (Supabase Auth)
3. Implementować real-time updates (Supabase Realtime)
4. Dodać więcej wizualizacji danych
5. Rozszerzyć system powiadomień
6. Dodać testy (Jest, React Testing Library)

## 📦 Dodatkowe biblioteki

Możesz zainstalować:
- **React Hook Form** - Zarządzanie formularzami
- **Zod** - Walidacja schematów
- **SWR** lub **React Query** - Data fetching
- **Framer Motion** - Animacje

```bash
npm install react-hook-form zod @hookform/resolvers
npm install swr
npm install framer-motion
```

## 🎨 Customizacja

### Zmiana kolorów
Edytuj `tailwind.config.ts` sekcję `colors.primary`

### Dodanie nowej strony
1. Utwórz folder w `app/` np. `app/reports/`
2. Dodaj `page.tsx`
3. Dodaj link w `components/layout/Sidebar.tsx`

### Nowy komponent UI
Utwórz w `components/ui/` i użyj `cn()` utility do stylowania

## 📄 Licencja

ISC
