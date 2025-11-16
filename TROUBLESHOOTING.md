# ⚠️ WAŻNE INFORMACJE PRZED URUCHOMIENIEM

## 🚨 Potencjalne Problemy i Rozwiązania

### 1. Backend nie startuje

**Problem:** `Missing required environment variable: AI_API_KEY`

**Rozwiązanie:**
```bash
cd backend
# Skopiuj plik przykładowy
Copy-Item .env.example .env
# Edytuj .env i dodaj swój klucz Gemini AI
```

**Gdzie uzyskać klucz:**
- https://aistudio.google.com/app/apikey (DARMOWE)

---

### 2. Błąd "Failed to decrypt data"

**Problem:** ENCRYPTION_KEY nie jest ustawiony lub został zmieniony

**Rozwiązanie:**
```bash
# Wygeneruj nowy klucz
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Dodaj go do backend/.env jako ENCRYPTION_KEY
```

**⚠️ UWAGA:** Jeśli już zapisałeś hasła email, zmiana klucza spowoduje ich utratę!

---

### 3. Frontend nie łączy się z backendem

**Problem:** Network Error / Connection refused

**Sprawdź:**
1. Czy backend działa na porcie 3001?
   ```bash
   # Powinien wyświetlić: Server is running on http://localhost:3001
   ```

2. Czy `frontend/.env.local` ma prawidłowy URL?
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. Czy port 3001 nie jest zajęty?
   ```powershell
   # Windows PowerShell:
   Get-NetTCPConnection -LocalPort 3001
   ```

---

### 4. AI nie odpowiada

**Możliwe przyczyny:**
- Nieprawidłowy klucz API Gemini
- Przekroczono limity darmowego planu (15 req/min)
- Brak połączenia z internetem

**Rozwiązanie:**
1. Sprawdź klucz API w Google AI Studio
2. Poczekaj minutę (rate limit)
3. Sprawdź logi backendu (terminal)

---

### 5. Port już zajęty

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Rozwiązanie:**
```powershell
# Windows PowerShell - zabij proces na porcie 3001
$port = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($port) {
    Stop-Process -Id $port.OwningProcess -Force
}

# Lub zmień port w backend/.env:
PORT=3002
```

---

### 6. Brak katalogu uploads

**Problem:** Ten problem został naprawiony! Katalogi są teraz tworzone automatycznie.

**Jeśli nadal wystąpi:**
```bash
cd backend
mkdir -p uploads/attachments
```

---

### 7. Supabase błędy (opcjonalne)

**Problem:** `Supabase credentials not found`

**To jest OSTRZEŻENIE, nie błąd!** Aplikacja działa bez Supabase, ale:
- Brak bazy danych (dane tylko w pamięci)
- Brak autentykacji użytkowników
- Brak persistencji

**Aby naprawić:**
1. Utwórz konto na https://supabase.com
2. Stwórz nowy projekt
3. Skopiuj URL i klucze do `.env`
4. Wykonaj SQL z plików `supabase-*.sql`

---

### 8. TypeScript błędy kompilacji

**Problem:** Błędy podczas `npm run dev` lub `npm run build`

**Rozwiązanie:**
```bash
# Usuń cache i node_modules
rm -rf node_modules
rm -rf .next  # dla frontendu
rm -rf dist   # dla backendu

# Reinstaluj
npm install

# Sprawdź wersję TypeScript
npm list typescript
```

---

### 9. Email nie wysyła się

**Wymagane zmienne:**
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `ENCRYPTION_KEY`

**Dla Gmail:**
1. Włącz weryfikację dwuetapową
2. Wygeneruj hasło aplikacji: https://myaccount.google.com/apppasswords
3. Użyj hasła aplikacji (nie hasła do konta!)

---

## ✅ Checklist przed uruchomieniem

### Backend:
- [ ] Node.js 18+ zainstalowany
- [ ] `npm install` wykonane
- [ ] Plik `backend/.env` istnieje
- [ ] `AI_API_KEY` ustawiony
- [ ] `ENCRYPTION_KEY` wygenerowany i ustawiony
- [ ] Backend działa na http://localhost:3001

### Frontend:
- [ ] `npm install` wykonane
- [ ] Plik `frontend/.env.local` istnieje (opcjonalnie)
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3001`
- [ ] Frontend działa na http://localhost:3000

---

## 🆘 Nadal nie działa?

1. **Sprawdź logi w terminalu** - większość błędów jest tam opisana
2. **Sprawdź console w przeglądarce** (F12) - błędy API
3. **Upewnij się, że oba serwery działają** (backend + frontend)
4. **Sprawdź pliki .env** - czy nie ma literówek

---

## 📚 Dodatkowa Dokumentacja

- `README.md` - Główna dokumentacja
- `QUICKSTART.md` - Szybki start (tylko AI chat)
- `USER_GUIDE.md` - Przewodnik użytkownika
- `SUPABASE_SETUP.md` - Konfiguracja bazy danych
- `EMAIL_INBOX_GUIDE.md` - Konfiguracja email

---

## 💡 Pro Tips

1. **Używaj PowerShell w Windows** - lepsze formatowanie
2. **Otwórz 2 terminale** - jeden dla backend, drugi dla frontend
3. **Najpierw uruchom backend** - frontend potrzebuje API
4. **Sprawdzaj health check** - http://localhost:3001/health
5. **Używaj trybu development** - więcej logów diagnostycznych
