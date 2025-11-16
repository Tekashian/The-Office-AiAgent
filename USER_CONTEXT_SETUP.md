# 🤖 System Kontekstu Użytkownika dla AI - Instrukcja

## 📋 Przegląd

System kontekstu użytkownika pozwala AI lepiej rozumieć Twoje potrzeby i generować trafniejsze odpowiedzi. AI wykorzystuje informacje o Twoim stanowisku, obowiązkach i preferencjach podczas:
- ✉️ Generowania emaili
- 📄 Tworzenia dokumentów PDF
- 🤖 Odpowiadania na pytania
- ⏰ Wykonywania zaplanowanych zadań (cron)

## 🚀 Konfiguracja (3 kroki)

### Krok 1: Uruchom migrację SQL w Supabase

1. Otwórz **Supabase Dashboard** → **SQL Editor**
2. Otwórz plik: `supabase-user-context-migration.sql`
3. Skopiuj całą zawartość
4. Wklej do SQL Editor i kliknij **RUN**

**Co robi migracja:**
- Dodaje nowe kolumny do tabeli `user_profiles`:
  - `job_title` - Twoje stanowisko
  - `work_description` - Opis obowiązków zawodowych
  - `company_description` - Informacje o firmie
  - `department` - Dział w którym pracujesz
  - `ai_context_notes` - Dodatkowe preferencje dla AI
  - `email_signature` - Podpis email z placeholderami
  - `preferences` (JSONB) - Preferencje komunikacji i powiadomień

### Krok 2: Uruchom backend

Backend automatycznie załaduje nowe endpointy:

```bash
cd backend
npm run dev
```

**Nowe endpointy API:**
- `GET /api/user/context` - Pobierz kontekst użytkownika
- `PUT /api/user/context` - Zaktualizuj kontekst
- `GET /api/user/context/ai-prompt` - Pobierz sformatowany kontekst dla AI
- `POST /api/user/context/reset` - Resetuj do wartości domyślnych

### Krok 3: Uruchom frontend

```bash
cd frontend
npm run dev
```

Otwórz: **http://localhost:3000/settings**

## 📝 Wypełnianie Kontekstu

### Sekcja 1: Profil Użytkownika
- **Imię i nazwisko** - Pełne imię (używane w podpisach)
- **Firma** - Nazwa firmy
- **Stanowisko** - Np. "Marketing Manager", "Senior Developer"
- **Dział** - Np. "Marketing", "IT", "Sprzedaż"

### Sekcja 2: Kontekst dla AI (NAJWAŻNIEJSZE)

#### Opis Twojej pracy i obowiązków
Przykład:
```
Zarządzam kampaniami marketingowymi w social media, tworzę cotygodniowe 
raporty sprzedażowe dla zarządu, koordynuję zespół 5 osób, planuję 
budżet marketingowy na kwartał, analizuję dane Google Analytics.
```

#### O Twojej firmie i branży
Przykład:
```
Zajmujemy się e-commerce w branży fashion, 50 pracowników, działamy 
głównie na rynku polskim, oferujemy ubrania premium dla kobiet 25-45 lat. 
Główna konkurencja to Reserved i Zara.
```

#### Dodatkowe preferencje dla AI
Przykład:
```
- Preferuję krótkie, konkretne emaile (max 5 zdań)
- Często używam emoji 📊 📈 w raportach
- Lubię dane w tabelach zamiast długiego tekstu
- Unikam zbyt formalnego tonu, ale zachowuję profesjonalizm
- W piątki używam bardziej swobodnego stylu
```

#### Preferowany ton komunikacji
Wybierz z listy:
- **Profesjonalny i formalny** - Dla korespondencji oficjalnej
- **Przyjazny ale profesjonalny** - Złoty środek (ZALECANE)
- **Swobodny i nieformalny** - Dla komunikacji wewnętrznej
- **Bardzo formalny** - Dla klientów korporacyjnych
- **Przyjazny i ciepły** - Dla bliskich relacji biznesowych

### Sekcja 3: Podpis Email

Użyj placeholderów (automatycznie zastępowane):
- `{{name}}` - Twoje imię i nazwisko
- `{{company}}` - Nazwa firmy
- `{{position}}` - Stanowisko
- `{{email}}` - Adres email

Przykład:
```
Pozdrawiam,
{{name}}
{{position}}
{{company}}
📧 {{email}}
📱 +48 123 456 789
🌐 www.firma.pl
```

### Sekcja 4: Powiadomienia

- ✅ **Email powiadomienia** - Otrzymuj alerty na email
- 📊 **Podsumowania dzienne** - Codzienny raport aktywności
- ⏰ **Przypomnienia o zadaniach** - Notyfikacje przed deadline

## 🎯 Jak AI Wykorzystuje Kontekst

### Generowanie Emaili
**Bez kontekstu:**
```
Temat: Pytanie o spotkanie
Dzień dobry,
Czy możemy umówić się na spotkanie w przyszłym tygodniu?
Pozdrawiam
```

**Z kontekstem (Marketing Manager):**
```
Temat: Omówienie kampanii Q1 📊
Cześć!
Czy moglibyśmy umówić się w przyszłym tygodniu, żeby omówić wyniki kampanii 
na social media i zaplanować budżet na Q1? Przygotowałem krótką prezentację 
z najważniejszymi metrykami.

Daj znać kiedy Ci pasuje!
Jan Kowalski
Marketing Manager | Fashion Co.
```

### Generowanie PDF
**Bez kontekstu:**
```
RAPORT

Dane za okres: 01-31.01.2024
Zawartość raportu...
```

**Z kontekstem (Marketing Manager w e-commerce):**
```
RAPORT SPRZEDAŻY - STYCZEŃ 2024
Fashion Co. | Dział Marketing

📊 PODSUMOWANIE WYKONAWCZE
- Sprzedaż online: +23% vs grudzeń
- ROI kampanii Meta: 4.2x
- Top kategoria: Kurtki damskie (1,234 szt.)

📈 ANALIZA KAMPANII
[tabela z danymi Google Analytics]

🎯 REKOMENDACJE NA LUTY
1. Zwiększyć budżet na Instagram o 30%
2. Wdrożyć kampanię remarketing...
```

### Scheduled Tasks (Cron)
AI automatycznie używa kontekstu w:
- Generowaniu cotygodniowych raportów
- Wysyłaniu przypomnień
- Tworzeniu dokumentów
- Odpowiedziach na emaile

## ✅ Testowanie

### Test 1: Sprawdź czy kontekst działa

1. Wypełnij **Kontekst AI** w `/settings`
2. Kliknij **Zapisz zmiany**
3. Przejdź do `/tasks` (Scheduled Tasks)
4. Stwórz zadanie **Email** z AI:
   - Prompt: "Napisz email do zespołu o planowaniu budżetu"
   - Zobacz czy AI użył Twojego stanowiska i tonu

### Test 2: Generowanie PDF

1. W `/tasks` stwórz zadanie **PDF**:
   - Prompt: "Wygeneruj raport sprzedażowy"
   - AI powinien uwzględnić Twoją firmę i branżę

### Test 3: Podpis Email

1. W `/email` wyślij testowy email
2. Sprawdź czy podpis został automatycznie dodany
3. Placeholdery powinny być zastąpione prawdziwymi danymi

## 🔧 Rozwiązywanie Problemów

### Problem: "Failed to fetch context"
**Rozwiązanie:** Sprawdź czy migracja SQL została wykonana prawidłowo.

```sql
-- Sprawdź czy kolumny istnieją:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('job_title', 'work_description', 'ai_context_notes');
```

### Problem: AI nie używa kontekstu
**Rozwiązanie:** 
1. Sprawdź logi backend: Szukaj `✅ User context loaded: X fields`
2. Sprawdź czy `userId` jest przekazywany do AIService
3. Zweryfikuj że zapisałeś zmiany w `/settings`

### Problem: Podpis nie działa
**Rozwiązanie:** 
1. Upewnij się że wypełniłeś `email_signature` w ustawieniach
2. Sprawdź czy używasz poprawnych placeholderów: `{{name}}`, nie `{name}`

## 📊 Statystyki i Monitorowanie

### Backend Logs
Szukaj w konsoli backend:
```
✅ User context loaded: 5 fields
🤖 Generating email template for category: reminder, user: abc-123
✅ Template generated successfully with user context
```

### Frontend
1. Otwórz Developer Tools (F12)
2. Zakładka Console
3. Szukaj: `User context fetched successfully`

## 🎓 Najlepsze Praktyki

### DO:
✅ Wypełnij **wszystkie pola** w sekcji "Kontekst AI"
✅ Bądź **konkretny** - im więcej szczegółów, tym lepsze wyniki
✅ **Aktualizuj** kontekst gdy zmienia się Twoja rola
✅ **Testuj** różne tony komunikacji i wybierz najlepszy

### NIE:
❌ Nie zostawiaj pustych pól - AI będzie generować ogólne odpowiedzi
❌ Nie używaj zbyt ogólnych opisów ("Pracuję w firmie")
❌ Nie zapominaj o preferencjach stylistycznych
❌ Nie używaj wrażliwych danych osobowych (PESEL, hasła)

## 🚀 Zaawansowane Użycie

### Custom Tone dla Różnych Odbiorców

W `ai_context_notes` możesz dodać:
```
TONY KOMUNIKACJI:
- Klienci zewnętrzni: formalny, konkretny
- Zespół wewnętrzny: przyjazny, swobodny z emoji
- Zarząd: profesjonalny, dane i liczby
- Partnerzy: ciepły ale biznesowy
```

### Branżowy Żargon

Dodaj specyficzne terminy dla Twojej branży:
```
TERMINOLOGIA:
- Używaj "conversion rate" zamiast "współczynnik konwersji"
- "ROI" zamiast "zwrot z inwestycji"
- "KPI" dla kluczowych metryk
```

### Preferencje Formatowania

```
FORMAT:
- Emaile: max 5 zdań, bullet points dla list
- Raporty: tabele + wykresy, podsumowanie na początku
- PDF: maksymalnie 2 strony, infografiki
```

## 📚 API Documentation

### GET /api/user/context
Pobiera pełny kontekst użytkownika.

**Response:**
```json
{
  "context": {
    "full_name": "Jan Kowalski",
    "company": "Fashion Co.",
    "job_title": "Marketing Manager",
    "work_description": "...",
    "preferences": {
      "communication_tone": "friendly-professional",
      "language": "pl"
    }
  }
}
```

### PUT /api/user/context
Aktualizuje kontekst użytkownika.

**Request:**
```json
{
  "job_title": "Senior Marketing Manager",
  "work_description": "Updated description...",
  "ai_context_notes": "New preferences..."
}
```

### GET /api/user/context/ai-prompt
Zwraca sformatowany kontekst gotowy do użycia w AI prompt.

**Response:**
```json
{
  "prompt_context": "=== KONTEKST UŻYTKOWNIKA ===\nImię: Jan Kowalski\nStanowisko: Marketing Manager\n...",
  "has_context": true,
  "fields_filled": 7
}
```

## 🎉 Gotowe!

Twój system kontekstu AI jest skonfigurowany! 

**Następne kroki:**
1. Wypełnij kontekst w `/settings`
2. Zapisz zmiany
3. Stwórz test task w `/tasks`
4. Ciesz się spersonalizowanymi odpowiedziami AI! 🚀

---

**Potrzebujesz pomocy?**
- Backend logi: `npm run dev` w konsoli
- Frontend logi: Developer Tools → Console (F12)
- Supabase logi: Dashboard → Logs

**Wersja:** 1.0.0  
**Data:** 2024  
**Autor:** The Office AI Agent Team
