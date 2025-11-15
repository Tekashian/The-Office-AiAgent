## 📝 SUPABASE SETUP - INSTRUKCJE KROK PO KROKU

### ✅ TAK - Musisz się zalogować do Supabase i wygenerować klucze API

## 🚀 Kroki do wykonania:

### Krok 1: Utwórz projekt Supabase (5 minut)

1. **Otwórz przeglądarkę i idź na:** https://supabase.com
2. **Zaloguj się przez GitHub** (kliknij "Start your project")
3. **Kliknij "New Project"** (zielony przycisk)
4. **Wypełnij formularz:**
   ```
   Organization: Twoja nazwa (jeśli pierwszy raz - zostanie utworzona)
   Name: the-office-ai-agent
   Database Password: WYGENERUJ I ZAPISZ! (kliknij "Generate a password")
   Region: Europe (Frankfurt) lub najbliższy Ci region
   Pricing Plan: Free (0 USD/month)
   ```
5. **Kliknij "Create new project"**
6. **Poczekaj ~2 minuty** na utworzenie projektu (pokazuje się pasek postępu)

---

### Krok 2: Uruchom SQL Schema (1 minuta)

Po utworzeniu projektu:

1. **W lewym menu kliknij ikonę SQL** (lub "SQL Editor")
2. **W VS Code otwórz plik:** `supabase-schema.sql`
3. **Zaznacz CAŁĄ zawartość** (Ctrl+A) i skopiuj (Ctrl+C)
4. **Wklej w SQL Editor w Supabase** (prawy panel)
5. **Kliknij "RUN"** (prawy dolny róg) lub Ctrl+Enter
6. **Poczekaj na komunikat "Success. No rows returned"**

✅ To utworzy 7 tabel, RLS policies, indexy i triggery!

---

### Krok 3: Pobierz klucze API (30 sekund)

1. **W lewym menu kliknij ikonę koła zębatego** → **Settings**
2. **Kliknij "API"** w lewym menu
3. **Skopiuj dwie wartości:**

   **A) Project URL** (np. `https://abcdefghijk.supabase.co`)
   ```
   Znajdziesz w sekcji "Project URL"
   ```

   **B) anon public key** (długi tekst zaczynający się od `eyJ...`)
   ```
   Znajdziesz w sekcji "Project API keys" → "anon public"
   Kliknij ikonę oka żeby pokazać, potem skopiuj
   ```

---

### Krok 4: Wklej klucze do plików .env

**W VS Code:**

#### Backend (.env)
Otwórz: `backend/.env`

Znajdź linie:
```env
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Zamień na:
```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_ANON_KEY=eyJ... (wklej cały klucz)
```

#### Frontend (.env.local)
Otwórz: `frontend/.env.local`

Znajdź linie:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Zamień na:
```env
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (wklej cały klucz)
```

---

### Krok 5: Restart serwerów (30 sekund)

**W terminalu:**

```powershell
# Zatrzymaj backend (Ctrl+C jeśli działa)
# Potem uruchom ponownie:
cd backend
npm run dev

# W NOWYM terminalu zatrzym frontend (Ctrl+C)
# Potem uruchom ponownie:
cd frontend
npm run dev
```

---

## 🎉 GOTOWE!

### Teraz możesz przetestować:

1. **Otwórz:** http://localhost:3000
2. **Zostaniesz przekierowany na:** http://localhost:3000/auth
3. **Kliknij "Don't have an account? Sign up"**
4. **Wypełnij:**
   - Full name: Twoje imię
   - Email: twój email
   - Password: minimum 6 znaków
5. **Kliknij "Sign up"**
6. **Sprawdź email** - Supabase wyśle link potwierdzający
7. **Kliknij link w emailu**
8. **Wróć do http://localhost:3000/auth**
9. **Zaloguj się tym samym emailem i hasłem**
10. **Gotowe!** Jesteś w aplikacji

---

## 📊 Co zostało zaimplementowane:

### Frontend:
✅ **Strona logowania/rejestracji** - `/auth`
✅ **Ustawienia email** - `/settings/email`
✅ **Chat z autoryzacją** - `/agent` (zapisuje historię do DB)
✅ **Automatyczny token w API** - axios interceptor

### Backend:
✅ **Middleware autoryzacji** - `middleware/auth.ts`
✅ **Szyfrowanie haseł** - `utils/encryption.ts`
✅ **Wszystkie API routes** z user isolation

### Database:
✅ **7 tabel** - profiles, email configs, emails, pdfs, scraper, cron, chat
✅ **Row Level Security** - każdy user widzi tylko swoje dane
✅ **Automatyczne tworzenie profilu** przy rejestracji

---

## 🧪 Test Email Settings:

Po zalogowaniu:
1. Idź na: http://localhost:3000/settings/email
2. Kliknij "Add Configuration"
3. Wypełnij:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: twoj@gmail.com
   SMTP Password: [App Password z Gmail]
   ```
4. **Jak wygenerować Gmail App Password:**
   - Idź na: https://myaccount.google.com/apppasswords
   - Zaloguj się
   - Kliknij "App passwords"
   - Wybierz "Mail" i "Other"
   - Nazwij "Office Agent"
   - Skopiuj 16-znakowe hasło
   - Wklej jako SMTP Password
5. Kliknij "Save Configuration"
6. Kliknij "Test" - powinien pokazać "Configuration is working!"

---

## 🔧 Jeśli masz problemy:

### "Supabase credentials not found"
→ Sprawdź czy skleiłeś klucze w obu plikach .env i zrestartowałeś serwery

### "Invalid token" / 401 error
→ Wyloguj się i zaloguj ponownie

### "Email not confirmed"
→ Sprawdź email i kliknij link potwierdzający, lub w Supabase Dashboard → Authentication → Users → kliknij na usera → Email Confirmed: ON

### Frontend nie startuje
→ Sprawdź czy w `frontend/.env.local` klucze zaczynają się od `NEXT_PUBLIC_`

---

## 📱 Dostępne strony:

- http://localhost:3000 → Przekierowanie do /auth lub /agent
- http://localhost:3000/auth → Logowanie/Rejestracja
- http://localhost:3000/agent → Chat AI (wymaga logowania)
- http://localhost:3000/settings/email → Ustawienia email (wymaga logowania)

---

Jak już masz klucze z Supabase, powiedz mi - dodam je do plików .env za Ciebie! 🚀
